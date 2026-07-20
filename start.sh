#!/usr/bin/env bash
# Startet einen Localhost-Server und öffnet den Browser.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PORT="${PORT:-8080}"
URL="http://127.0.0.1:${PORT}/"

# Freien Port finden, falls 8080 belegt ist
is_port_free() {
  ! (echo >/dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1
}

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Fehler: Python wurde nicht gefunden."
  echo "Bitte Python 3 installieren und erneut starten."
  exit 1
fi

if ! is_port_free "$PORT"; then
  for try in 8081 8082 8083 8090 8888; do
    if is_port_free "$try"; then
      PORT="$try"
      URL="http://127.0.0.1:${PORT}/"
      break
    fi
  done
fi

open_browser() {
  if command -v open >/dev/null 2>&1; then
    # macOS
    open "$URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v wslview >/dev/null 2>&1; then
    wslview "$URL" >/dev/null 2>&1 || true
  fi
}

echo ""
echo "  Schulprojekte – Localhost"
echo "  ========================="
echo ""
echo "  Browser öffnet sich gleich:"
echo "  → ${URL}"
echo ""
echo "  Projekte:"
echo "  • Le coin Internet     ${URL}le-coin-internet/"
echo "  • Ultra-Cool Website   ${URL}Projekte%20Creative/"
echo "  • DayFlow              ${URL}dayflow/"
echo ""
echo "  Server läuft... (Beenden mit Strg + C)"
echo ""

# Browser kurz verzögert öffnen, damit der Server schon lauscht
(sleep 0.6 && open_browser) &

exec "$PYTHON" -m http.server "$PORT" --bind 127.0.0.1
