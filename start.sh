#!/usr/bin/env bash
# Le coin Internet – einfacher Localhost
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8080}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Fehler: Python 3 fehlt. Bitte Python installieren."
  exit 1
fi

URL="http://127.0.0.1:${PORT}/"

echo ""
echo "  Le coin Internet"
echo "  ================"
echo ""
echo "  Browser öffnet sich gleich:"
echo "  → ${URL}"
echo ""
echo "  Beenden: Strg + C"
echo ""

# Browser nach kurzer Pause öffnen
(
  sleep 0.5
  if command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v wslview >/dev/null 2>&1; then
    wslview "$URL" >/dev/null 2>&1 || true
  fi
) &

exec "$PYTHON" -m http.server "$PORT" --bind 127.0.0.1
