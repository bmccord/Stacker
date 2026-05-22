#!/usr/bin/env bash
#
# check-env.sh — Verify .env files exist before running dev server.
# Called by yarn dev:setup. Exits with an error if init-env hasn't been run.
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f "$REPO_ROOT/stacker-api/.env" ]; then
  echo ""
  echo -e "${RED}✖${NC} No .env file found in stacker-api/."
  echo ""
  echo -e "  Run ${YELLOW}yarn init-env${NC} from the repo root to set up your environment."
  echo ""
  exit 1
fi
