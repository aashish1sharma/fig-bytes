#!/bin/bash
set -euo pipefail

for LABEL in com.sector-daily-dashboard.refresh com.sector-daily-dashboard.server; do
  PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
  launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  rm -f "$PLIST"
done

echo "Removed daily refresh schedule and dashboard server launch agents."
