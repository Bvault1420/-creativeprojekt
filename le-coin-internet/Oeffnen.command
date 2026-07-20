#!/bin/bash
# Doppelklick auf dem Mac → startet Server und öffnet Safari
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/start-mac.command"
