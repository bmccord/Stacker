#!/usr/bin/env bash
#
# kill-port.sh — Kill any process tree holding port 4000.
# Kills both the process on the port AND its parent (e.g., nodemon),
# preventing the parent from respawning the child.
#

PORT=4000

PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
if [ -z "$PID" ]; then
  exit 0
fi

# Get the parent PID
PPID_VAL=$(ps -p "$PID" -o ppid= 2>/dev/null | tr -d ' ')

# Kill the child first, then the parent (if it's nodemon or similar)
kill -9 "$PID" 2>/dev/null

if [ -n "$PPID_VAL" ] && [ "$PPID_VAL" != "1" ]; then
  # Check if parent is a node process (nodemon, ts-node, etc.)
  PARENT_CMD=$(ps -p "$PPID_VAL" -o command= 2>/dev/null || true)
  if echo "$PARENT_CMD" | grep -q "node"; then
    kill -9 "$PPID_VAL" 2>/dev/null
  fi
fi

# Brief wait to ensure port is released
sleep 0.5
