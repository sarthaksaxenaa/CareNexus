"""CareNexus — One-click project launcher.

Starts both the FastAPI backend (port 8000) and Next.js frontend (port 3000)
with a single command:

    python run.py

Press Ctrl+C to stop both servers.
"""

import os
import signal
import subprocess
import sys
import time

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


# ─── Preflight checks ───────────────────────────────────────────────────────

def preflight() -> bool:
    """Verify that backend venv and frontend node_modules exist."""
    ok = True

    if not os.path.isfile(VENV_PYTHON):
        log("ERROR", f"Backend venv not found at: {VENV_PYTHON}")
        log("FIX", "Run:  cd backend && python -m venv venv && venv\\Scripts\\pip install -r requirements.txt")
        ok = False

    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        log("ERROR", f"Frontend node_modules not found at: {node_modules}")
        log("FIX", "Run:  cd frontend && npm install")
        ok = False

    return ok


# ─── Server launchers ───────────────────────────────────────────────────────

def start_backend() -> subprocess.Popen:
    """Launch the FastAPI backend via uvicorn."""
    log("BACKEND", f"Starting FastAPI on http://{BACKEND_HOST}:{BACKEND_PORT}")
    cmd = [
        VENV_PYTHON, "-m", "uvicorn",
        "app.main:app",
        "--host", BACKEND_HOST,
        "--port", str(BACKEND_PORT),
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
