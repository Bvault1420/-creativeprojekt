#!/usr/bin/env bash
# Nur „Le coin Internet“ – erreichbar am PC und in Safari auf dem Tablet.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PORT="${PORT:-8080}"

is_port_free() {
  ! (echo >/dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1
}

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Fehler: Python wurde nicht gefunden."
  exit 1
fi

if ! is_port_free "$PORT"; then
  for try in 8081 8082 8083 8090 8888; do
    if is_port_free "$try"; then
      PORT="$try"
      break
    fi
  done
fi

detect_lan_ip() {
  local ip=""
  if command -v ipconfig >/dev/null 2>&1 && [[ "$(uname -s)" == "Darwin" ]]; then
    ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
    [[ -z "$ip" ]] && ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  fi
  if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  if [[ -z "$ip" ]] && command -v ip >/dev/null 2>&1; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}' || true)"
  fi
  echo "$ip"
}

LAN_IP="$(detect_lan_ip)"
LOCAL_URL="http://127.0.0.1:${PORT}/"
if [[ -n "$LAN_IP" ]]; then
  TABLET_URL="http://${LAN_IP}:${PORT}/"
else
  TABLET_URL="(IP nicht gefunden)"
fi

echo "$TABLET_URL" > "${ROOT}/.tablet-url.txt"

open_browser() {
  if command -v open >/dev/null 2>&1; then
    open "$LOCAL_URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$LOCAL_URL" >/dev/null 2>&1 || true
  fi
}

echo ""
echo "  Le coin Internet – Localhost (PC + Tablet)"
echo "  =========================================="
echo ""
echo "  Am Computer:"
echo "  → ${LOCAL_URL}"
echo ""
echo "  Am Tablet / iPad (Safari, gleiches WLAN):"
echo "  → ${TABLET_URL}"
echo ""
echo "  Server läuft... (Beenden mit Strg + C)"
echo ""

(sleep 0.6 && open_browser) &
exec "$PYTHON" -m http.server "$PORT" --bind 0.0.0.0
