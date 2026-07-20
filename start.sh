#!/usr/bin/env bash
# Funktionaler Localhost (PC + Safari auf Tablet/iPad)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Fehler: Python 3 wurde nicht gefunden."
  exit 1
fi

chmod +x "$ROOT/server.py" 2>/dev/null || true
exec "$PYTHON" "$ROOT/server.py" "$@"
