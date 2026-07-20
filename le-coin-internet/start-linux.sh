#!/usr/bin/env bash
# Le coin Internet – Linux (Chrome, Firefox, …)
cd "$(dirname "$0")"

PORT=8080
URL="http://127.0.0.1:${PORT}/"

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
  fi
}
trap cleanup EXIT INT TERM

echo ""
echo "  Le coin Internet – Localhost (Linux)"
echo "  ==================================="
echo ""
echo "  URL im Browser:"
echo "  → ${URL}"
echo ""

if ! command -v python3 >/dev/null 2>&1; then
  echo "  Fehler: python3 ist nicht installiert."
  echo "  Installieren: sudo apt install python3"
  exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
sleep 1

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "  Fehler: Server konnte nicht gestartet werden."
  echo "  Ist Port ${PORT} schon belegt?"
  exit 1
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 &
  echo "  Browser wird geöffnet…"
elif command -v sensible-browser >/dev/null 2>&1; then
  sensible-browser "$URL" >/dev/null 2>&1 &
  echo "  Browser wird geöffnet…"
else
  echo "  Öffne diese Adresse manuell in deinem Browser."
fi

echo ""
echo "  Server läuft… (Beenden mit Strg + C)"
echo ""

wait "$SERVER_PID"
