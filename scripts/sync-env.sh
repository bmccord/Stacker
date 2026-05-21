#!/usr/bin/env bash
#
# sync-env.sh — Regenerate .env files from Doppler (non-interactive).
#
# Called by `yarn dev` in each project to ensure .env files are up to date.
# If Doppler is not configured, prints a message and exits (does not block dev).
#

set -euo pipefail

FORCE=false
if [ "${1:-}" = "--force" ]; then
  FORCE=true
fi

DOPPLER_PROJECT="stacker"
DOPPLER_BASE_CONFIG="local"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Doppler is available and authenticated
if ! command -v doppler &> /dev/null; then
  echo -e "${YELLOW}⚠${NC} Doppler CLI not installed. Skipping .env sync."
  echo "  Install Doppler or create .env files manually."
  exit 0
fi

if ! doppler me &> /dev/null; then
  echo -e "${YELLOW}⚠${NC} Doppler not authenticated. Skipping .env sync."
  echo "  Run 'doppler login' to authenticate."
  exit 0
fi

# Find the developer's branch config
USERNAME=$(whoami | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
CONFIG_NAME="${DOPPLER_BASE_CONFIG}_${USERNAME}"

# Check if branch config exists
if ! doppler configs --project "$DOPPLER_PROJECT" --json 2>/dev/null | python3 -c "
import json, sys
configs = json.load(sys.stdin)
sys.exit(0 if any(c['name'] == '$CONFIG_NAME' for c in configs) else 1)
" 2>/dev/null; then
  echo -e "${YELLOW}⚠${NC} Doppler config '$CONFIG_NAME' not found. Skipping .env sync."
  exit 0
fi

# Fetch secrets from Doppler
SECRETS=$(doppler secrets --project "$DOPPLER_PROJECT" --config "$CONFIG_NAME" --json 2>/dev/null)

# Generate .env content
TMPDIR_SYNC=$(mktemp -d)
trap "rm -rf $TMPDIR_SYNC" EXIT

echo "$SECRETS" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}

def write_env(path, prefix):
    with open(path, 'w') as f:
        f.write('# Auto-generated from Doppler — do not edit manually.\n\n')
        for k, v in sorted(d.items()):
            if k in skip:
                continue
            val = v.get('computed', '')
            if k.startswith(prefix):
                env_key = k[len(prefix):]
                f.write(f'{env_key}=\"{val}\"\n')

write_env('$TMPDIR_SYNC/api.env', 'API_')
write_env('$TMPDIR_SYNC/ui.env', 'UI_')
write_env('$TMPDIR_SYNC/cli.env', 'CLI_')
write_env('$TMPDIR_SYNC/root.env', 'ROOT_')
"

# Compare and write each file
check_and_write() {
  local new_file="$1"
  local target_file="$2"
  local label="$3"

  if [ ! -f "$target_file" ]; then
    cp "$new_file" "$target_file"
    return
  fi

  local existing_content new_content
  existing_content=$(grep -v '^#' "$target_file" | grep -v '^$' | sort)
  new_content=$(grep -v '^#' "$new_file" | grep -v '^$' | sort)

  if [ "$existing_content" = "$new_content" ]; then
    cp "$new_file" "$target_file"
    return
  fi

  if [ "$FORCE" = true ]; then
    cp "$new_file" "$target_file"
  else
    echo -e "${YELLOW}⚠${NC} ${label} has local changes. Use --force to overwrite."
  fi
}

check_and_write "$TMPDIR_SYNC/api.env" "$REPO_ROOT/stacker-api/.env" "stacker-api/.env"
check_and_write "$TMPDIR_SYNC/ui.env" "$REPO_ROOT/stacker-ui/.env" "stacker-ui/.env"
check_and_write "$TMPDIR_SYNC/cli.env" "$REPO_ROOT/stacker-cli/.env" "stacker-cli/.env"
check_and_write "$TMPDIR_SYNC/root.env" "$REPO_ROOT/.env" "root .env"

echo -e "${GREEN}✔${NC} .env files synced from Doppler"
