#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"
LOG_FILE="$LOG_DIR/refresh.log"
NODE="${NODE:-$(command -v node)}"

mkdir -p "$LOG_DIR"

{
  echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  cd "$ROOT"
  "$NODE" scripts/fetch-news.mjs
  echo
} >> "$LOG_FILE" 2>&1
