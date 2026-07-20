#!/usr/bin/env bash
# Allgemeiner Start – leitet auf Linux- oder Mac-Skript weiter
cd "$(dirname "$0")" || exit 1

case "$(uname -s)" in
  Darwin)
    exec ./start-mac.command
    ;;
  Linux)
    exec ./start-linux.sh
    ;;
  *)
    PORT="${PORT:-8080}"
    echo ""
    echo "  Le coin Internet – Localhost"
    echo "  ============================="
    echo ""
    echo "  Öffne im Browser:"
    echo "  → http://127.0.0.1:${PORT}/"
    echo ""
    exec python3 -m http.server "$PORT" --bind 127.0.0.1
    ;;
esac
