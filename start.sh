#!/usr/bin/env bash
# CareNexus one-command launcher for macOS and Linux: ./start.sh
cd "$(dirname "$0")" || exit 1
command -v python3 >/dev/null || { echo "Python 3.12+ is required: https://www.python.org/downloads/"; exit 1; }
command -v npm >/dev/null || { echo "Node.js 20+ is required: https://nodejs.org/"; exit 1; }
exec python3 run.py "$@"
