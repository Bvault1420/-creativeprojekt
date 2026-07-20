#!/usr/bin/env bash
# Le coin Internet – Linux (Chrome, Firefox, …)
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
echo "  Le coin Internet – Localhost (Linux)"
echo "  ==================================="
echo ""

if ! command -v python3 >/dev/null 2>&1; then
  echo "  Fehler: python3 ist nicht installiert."
  echo "  Installieren: sudo apt install python3"
  exit 1
fi

find_free_port() {
  local try_port="$1"
  local max_tries=10
  local i=0
  while [[ $i -lt $max_tries ]]; do
    if ! ss -ltn 2>/dev/null | grep -q ":${try_port} " && \
       ! netstat -ltn 2>/dev/null | grep -q ":${try_port} "; then
      echo "$try_port"
      return 0
    fi
    try_port=$((try_port + 1))
    i=$((i + 1))
  done
  return 1
}

if command -v ss >/dev/null 2>&1 || command -v netstat >/dev/null 2>&1; then
  FREE_PORT="$(find_free_port "$PORT" || true)"
  if [[ -n "${FREE_PORT:-}" ]]; then
    PORT="$FREE_PORT"
    URL="http://127.0.0.1:${PORT}/"
  fi
fi

echo "  URL im Browser:"
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
    echo "  Starte manuell: python3 -m http.server ${PORT} --bind 127.0.0.1"
    exit 1
  fi
  sleep 0.2
done

if [[ "$ready" -ne 1 ]]; then
  echo "  Fehler: Server antwortet nicht auf ${URL}"
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
