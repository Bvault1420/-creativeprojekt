#!/usr/bin/env bash
# Startet den funktionalen Root-Localhost (Übersicht inkl. Le coin Internet)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec ./start.sh "$@"
