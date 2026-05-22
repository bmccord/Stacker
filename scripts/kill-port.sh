#!/usr/bin/env bash
#
# kill-port.sh — Kill any process tree holding port 4000.
# Uses process group kill to take out the entire tree
# (yarn → nodemon → ts-node) in one shot.
#

PORT=4000

PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
if [ -z "$PID" ]; then
  exit 0
fi

# Get the process group ID and kill the entire group
PGID=$(ps -p "$PID" -o pgid= 2>/dev/null | tr -d ' ')
if [ -n "$PGID" ] && [ "$PGID" != "0" ]; then
  kill -9 -"$PGID" 2>/dev/null
else
  kill -9 "$PID" 2>/dev/null
fi

# Wait for port to be released
sleep 0.5
