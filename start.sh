#!/usr/bin/env bash
# Startet einen WLAN-fähigen Localhost-Server (PC + Handy + Tablet/iPad).
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
  echo "Bitte Python 3 installieren und erneut starten."
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

# LAN-IP ermitteln (für Safari auf dem Tablet im gleichen WLAN)
detect_lan_ip() {
  local ip=""
  if command -v ipconfig >/dev/null 2>&1 && [[ "$(uname -s)" == "Darwin" ]]; then
    # macOS: aktive IP (en0/en1 …)
    ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
    if [[ -z "$ip" ]]; then
      ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
    fi
  fi
  if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  if [[ -z "$ip" ]] && command -v ip >/dev/null 2>&1; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}' || true)"
  fi
  if [[ -z "$ip" ]]; then
    ip="$(ifconfig 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}' | sed 's/addr://' || true)"
  fi
  echo "$ip"
}

LAN_IP="$(detect_lan_ip)"
LOCAL_URL="http://127.0.0.1:${PORT}/"
if [[ -n "$LAN_IP" ]]; then
  TABLET_URL="http://${LAN_IP}:${PORT}/"
else
  TABLET_URL="(IP nicht gefunden – in den Netzwerkeinstellungen nachschauen)"
fi

# URL für Tablet in Datei schreiben (zum Ablesen / Teilen)
cat > "${ROOT}/.tablet-url.txt" <<EOF
${TABLET_URL}
EOF

open_browser() {
  if command -v open >/dev/null 2>&1; then
    open "$LOCAL_URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$LOCAL_URL" >/dev/null 2>&1 || true
  elif command -v wslview >/dev/null 2>&1; then
    wslview "$LOCAL_URL" >/dev/null 2>&1 || true
  fi
}

echo ""
echo "  Schulprojekte – Localhost (PC + Handy + Tablet)"
echo "  ==============================================="
echo ""
echo "  Am Computer (Browser öffnet sich):"
echo "  → ${LOCAL_URL}"
echo ""
echo "  Am Handy / Tablet (gleiches WLAN):"
echo "  → ${TABLET_URL}"
echo ""
echo "  So geht's am Handy:"
echo "  1. Handy und Computer im gleichen WLAN"
echo "  2. Auf der PC-Seite den QR-Code mit der Handy-Kamera scannen"
echo "  3. Oder die Adresse eintippen: ${TABLET_URL}"
echo "  4. Fertig – Seite wählen"
echo ""
echo "  Projekte:"
echo "  • Le coin Internet     …/le-coin-internet/"
echo "  • Ultra-Cool Website   …/Projekte%20Creative/"
echo "  • DayFlow              …/dayflow/"
echo ""
echo "  Server läuft im ganzen WLAN... (Beenden mit Strg + C)"
echo ""

(sleep 0.6 && open_browser) &

# 0.0.0.0 = erreichbar von PC UND Tablet im WLAN
exec "$PYTHON" -m http.server "$PORT" --bind 0.0.0.0
