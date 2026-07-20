#!/bin/bash
# Doppelklick (Mac): Localhost für Computer + Safari auf dem Tablet/iPad.
cd "$(dirname "$0")"
chmod +x ./start.sh 2>/dev/null || true
exec ./start.sh
