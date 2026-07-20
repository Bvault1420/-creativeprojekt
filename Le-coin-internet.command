#!/bin/bash
# Doppelklick (Mac): startet einen Localhost und oeffnet direkt "Le coin Internet".
cd "$(dirname "$0")"

PORT=8080
URL="http://localhost:${PORT}/le-coin-internet/"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "Python 3 wird benoetigt. Bitte installieren: https://www.python.org/downloads/"
  read -r -p "Enter zum Schliessen..." _
  exit 1
fi

open_url() {
  sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi
}

echo ""
echo "  Le coin Internet"
echo "  ----------------"
echo "  Oeffnet sich im Browser: $URL"
echo "  Beenden: dieses Fenster schliessen oder Strg + C"
echo ""

open_url &
exec "$PY" -m http.server "$PORT"
