#!/bin/bash
# Doppelklick (Mac): funktionaler Localhost für PC + Safari auf dem Tablet.
cd "$(dirname "$0")"
chmod +x ./start.sh ./server.py 2>/dev/null || true
exec ./start.sh
