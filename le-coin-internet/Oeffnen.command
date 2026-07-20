#!/bin/bash
cd "$(dirname "$0")/.."
chmod +x ./start.sh ./server.py 2>/dev/null || true
exec ./start.sh
