#!/usr/bin/env bash
# Le coin Internet – Localhost starten
set -euo pipefail
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Fehler: Python 3 fehlt. Bitte Python installieren und erneut starten."
  exit 1
fi

chmod +x "$0" ./server.py 2>/dev/null || true
exec "$PYTHON" ./server.py "$@"
