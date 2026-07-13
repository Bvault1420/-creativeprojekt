#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT=8080
echo ""
echo "  Le coin Internet – Localhost"
echo "  ============================="
echo ""
echo "  Öffne im Browser:"
echo "  → http://localhost:${PORT}"
echo ""
echo "  Beenden mit: Strg + C"
echo ""
python3 -m http.server "$PORT" --bind 127.0.0.1
