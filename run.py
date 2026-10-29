"""CareNexus — One-click project launcher.

Starts both the FastAPI backend (port 8000) and Next.js frontend (port 3000)
with a single command:

    python run.py              # installs/updates dependencies, opens the browser
    python run.py --no-browser

Press Ctrl+C to stop both servers.
"""

import hashlib
import os
import signal
import subprocess
import sys
import time
import urllib.request
import webbrowser

# ─── Configuration ───────────────────────────────────────────────────────────

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Detect Python executable inside the backend venv
if sys.platform == "win32":
    VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
else:
    VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "bin", "python")

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000
FRONTEND_PORT = 3000


def log(label: str, msg: str) -> None:
    print(f"[{label}] {msg}")


# ─── Dependency sync ────────────────────────────────────────────────────────
#
# Each install records a hash of the manifest it installed from. On start we
# compare hashes, so after a `git pull` that adds a package (e.g. the 3D body
# map's @react-three/drei) dependencies are installed automatically instead of
# failing with "Module not found".


def _file_hash(path: str) -> str:
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def _needs_install(manifest: str, stamp: str) -> bool:
    if not os.path.isfile(stamp):
        return True
    with open(stamp, encoding="utf-8") as fh:
        return fh.read().strip() != _file_hash(manifest)


def _write_stamp(manifest: str, stamp: str) -> None:
    with open(stamp, "w", encoding="utf-8") as fh:
        fh.write(_file_hash(manifest))


def _run(cmd: list[str], cwd: str) -> bool:
    log("SETUP", " ".join(cmd))
    return subprocess.call(cmd, cwd=cwd) == 0


def sync_backend() -> bool:
    """Create the venv if missing and install requirements when they change."""
    if not os.path.isfile(VENV_PYTHON):
        log("SETUP", "Creating backend virtual environment...")
        if not _run([sys.executable, "-m", "venv", "venv"], BACKEND_DIR):
            return False
    manifest = os.path.join(BACKEND_DIR, "requirements.txt")
    stamp = os.path.join(BACKEND_DIR, "venv", ".requirements.sha256")
    if not _needs_install(manifest, stamp):
        return True
    log("SETUP", "Backend dependencies changed - installing...")
    if not _run(
        [VENV_PYTHON, "-m", "pip", "install", "-r", "requirements.txt"], BACKEND_DIR
    ):
        return False
    _write_stamp(manifest, stamp)
    return True


def sync_frontend() -> bool:
    """Run `npm ci` when package-lock.json changes (exact, reproducible install)."""
    manifest = os.path.join(FRONTEND_DIR, "package-lock.json")
    stamp = os.path.join(FRONTEND_DIR, "node_modules", ".package-lock.sha256")
    if not _needs_install(manifest, stamp):
        return True
    log("SETUP", "Frontend dependencies changed - installing (npm ci)...")
    npm = ["cmd", "/c", "npm"] if sys.platform == "win32" else ["npm"]
    if not _run([*npm, "ci", "--no-audit", "--no-fund"], FRONTEND_DIR):
        return False
    _write_stamp(manifest, stamp)
    return True


def preflight() -> bool:
    """Make sure both apps have up-to-date dependencies before starting."""
    ok = sync_backend()
    if not ok:
        log("ERROR", "Backend install failed - see the pip output above.")
        return False
    if not sync_frontend():
        log("ERROR", "Frontend install failed. Stop any running dev server and retry.")
        return False
    return True


def open_when_ready(url: str, timeout: float = 90) -> None:
    """Open the browser once the frontend answers, instead of on a fixed sleep."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            webbrowser.open(url)
            return
        except OSError:
            time.sleep(1)
    log("INFO", f"Frontend not answering yet - open {url} manually.")


# ─── Server launchers ───────────────────────────────────────────────────────


def start_backend() -> subprocess.Popen:
    """Launch the FastAPI backend via uvicorn."""
    log("BACKEND", f"Starting FastAPI on http://{BACKEND_HOST}:{BACKEND_PORT}")
    cmd = [
        VENV_PYTHON,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        BACKEND_HOST,
        "--port",
        str(BACKEND_PORT),
        "--reload",
    ]
    return subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )


def start_frontend() -> subprocess.Popen:
    """Launch the Next.js frontend dev server."""
    log("FRONTEND", f"Starting Next.js on http://localhost:{FRONTEND_PORT}")
    if sys.platform == "win32":
        cmd = ["cmd", "/c", "npm", "run", "dev"]
    else:
        cmd = ["npm", "run", "dev"]
    return subprocess.Popen(
        cmd,
        cwd=FRONTEND_DIR,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )


# ─── Main ────────────────────────────────────────────────────────────────────


def main() -> None:
    print()
    print("=" * 44)
    print("       CareNexus -- Project Launcher")
    print("=" * 44)
    print()

    if not preflight():
        sys.exit(1)

    processes: list[subprocess.Popen] = []

    def shutdown(signum=None, frame=None):
        print()
        log("SHUTDOWN", "Stopping all servers...")
        for proc in processes:
            try:
                proc.terminate()
            except (ProcessLookupError, OSError):
                pass
        for proc in processes:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        log("DONE", "All servers stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        backend = start_backend()
        processes.append(backend)

        # Give backend a moment to start before launching frontend
        time.sleep(2)

        frontend = start_frontend()
        processes.append(frontend)

        print()
        log("READY", f"Backend  -> http://{BACKEND_HOST}:{BACKEND_PORT}")
        log("READY", f"Frontend -> http://localhost:{FRONTEND_PORT}")
        log("INFO", "Press Ctrl+C to stop both servers.")
        print()

        if "--no-browser" not in sys.argv:
            open_when_ready(f"http://localhost:{FRONTEND_PORT}")

        # Wait for either process to exit
        while True:
            for proc in processes:
                ret = proc.poll()
                if ret is not None:
                    name = "Backend" if proc == backend else "Frontend"
                    log("EXIT", f"{name} exited with code {ret}")
                    shutdown()
            time.sleep(1)

    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
