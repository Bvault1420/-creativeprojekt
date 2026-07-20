#!/bin/bash
# Doppelklick (Mac): Le coin Internet im Browser öffnen
cd "$(dirname "$0")"
chmod +x ./start.sh 2>/dev/null || true
exec ./start.sh
