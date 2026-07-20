#!/bin/bash
# Doppelklick (Mac): öffnet Le coin Internet unter localhost
cd "$(dirname "$0")"
chmod +x ./start.sh ./server.py 2>/dev/null || true
exec ./start.sh
