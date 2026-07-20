#!/bin/bash
# Le coin Internet – Mac (Safari)
set -euo pipefail

cd "$(dirname "$0")" || exit 1

PORT="${PORT:-8080}"
URL="http://127.0.0.1:${PORT}/"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo ""
echo "  Le coin Internet – Localhost (Mac / Safari)"
echo "  ============================================"
echo ""

if ! command -v python3 >/dev/null 2>&1; then
  echo "  Fehler: python3 fehlt."
  echo "  Installieren: xcode-select --install"
  exit 1
fi

echo "  URL in Safari:"
echo "  → ${URL}"
echo ""

python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!

ready=0
for _ in $(seq 1 20); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "  Fehler: Server ist abgestürzt."
    exit 1
  fi
  sleep 0.2
done

if [[ "$ready" -ne 1 ]]; then
  echo "  Fehler: Server antwortet nicht auf ${URL}"
  exit 1
fi

open -a Safari "$URL"
echo "  Safari wird geöffnet…"
echo ""
echo "  Server läuft… (Fenster schließen oder Strg + C zum Beenden)"
echo ""

wait "$SERVER_PID"
