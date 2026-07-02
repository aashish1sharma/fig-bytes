#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.sector-daily-dashboard.refresh"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
REFRESH_SCRIPT="$ROOT/scripts/refresh.sh"
NODE="$(command -v node)"

if [[ ! -x "$REFRESH_SCRIPT" ]]; then
  chmod +x "$REFRESH_SCRIPT"
fi

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$ROOT/logs"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${REFRESH_SCRIPT}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE</key>
    <string>${NODE}</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>7</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${ROOT}/logs/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${ROOT}/logs/launchd.err.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Scheduled daily refresh at 7:00 AM local time."
echo "Launch agent: $PLIST"
echo "Logs: $ROOT/logs/refresh.log"
