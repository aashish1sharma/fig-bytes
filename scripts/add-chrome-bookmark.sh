#!/bin/bash
set -euo pipefail

BOOKMARKS="$HOME/Library/Application Support/Google/Chrome/Default/Bookmarks"
URL="http://localhost:3456/"
NAME="India FIG Bytes"

if [[ ! -f "$BOOKMARKS" ]]; then
  echo "Chrome bookmarks file not found at: $BOOKMARKS"
  exit 1
fi

node "$(dirname "$0")/add-chrome-bookmark.mjs" "$BOOKMARKS" "$URL" "$NAME"
