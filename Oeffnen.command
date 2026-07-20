#!/bin/bash
# Doppelklick auf dem Mac: startet Localhost und öffnet den Browser.
cd "$(dirname "$0")"
chmod +x ./start.sh 2>/dev/null || true
exec ./start.sh
