#!/bin/bash
# Le coin Internet – Mac (Safari)
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
echo "  Le coin Internet – Localhost (Mac / Safari)"
echo "  ============================================"
echo ""
echo "  URL in Safari:"
echo "  → ${URL}"
echo ""

if ! command -v python3 >/dev/null 2>&1; then
  echo "  Fehler: python3 fehlt."
  echo "  Installieren: xcode-select --install"
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

open -a Safari "$URL"
echo "  Safari wird geöffnet…"
echo ""
echo "  Server läuft… (Fenster schließen oder Strg + C zum Beenden)"
echo ""

wait "$SERVER_PID"
