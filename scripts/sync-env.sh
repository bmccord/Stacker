#!/usr/bin/env bash
#
# sync-env.sh — Regenerate .env files from Doppler (non-interactive).
#
# Called by `yarn dev` in each project to ensure .env files are up to date.
# If Doppler is not configured, prints a message and exits (does not block dev).
#
# If a local .env file has changes not in Doppler, warns the developer and
# skips the overwrite so they can run `yarn push-env` first.
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

# Check if Doppler is available and authenticated — skip silently if not.
# Local-mode developers manage .env files directly; no sync needed.
if ! command -v doppler &> /dev/null; then
  exit 0
fi

if ! doppler me &> /dev/null; then
  exit 0
fi

# Find the developer's branch config
USERNAME=$(whoami | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
CONFIG_NAME="${DOPPLER_BASE_CONFIG}_${USERNAME}"

# Check if branch config exists
# Check if branch config exists — skip silently if Doppler project isn't set up
if ! doppler configs --project "$DOPPLER_PROJECT" --json 2>/dev/null | python3 -c "
import json, sys
configs = json.load(sys.stdin)
sys.exit(0 if any(c['name'] == '$CONFIG_NAME' for c in configs) else 1)
" 2>/dev/null; then
  exit 0
fi

# Check if personal values are set
ADMIN_EMAIL=$(doppler secrets get API_SEED_ADMIN_EMAIL --project "$DOPPLER_PROJECT" --config "$CONFIG_NAME" --plain 2>/dev/null || echo "")
if [ -z "$ADMIN_EMAIL" ]; then
  exit 0
fi

# Fetch secrets from Doppler
SECRETS=$(doppler secrets --project "$DOPPLER_PROJECT" --config "$CONFIG_NAME" --json 2>/dev/null)

# Generate .env content to a temp directory, then compare before overwriting
TMPDIR_SYNC=$(mktemp -d)
trap "rm -rf $TMPDIR_SYNC" EXIT

echo "$SECRETS" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}

def write_env(path, prefix):
    with open(path, 'w') as f:
        f.write('# Auto-generated from Doppler — do not edit manually.\n')
        f.write('# Update via Doppler or run: yarn push-env\n\n')
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

# Compare and write each file, warning if local has unpushed changes
HAS_DRIFT=false

check_and_write() {
  local new_file="$1"
  local target_file="$2"
  local label="$3"

  if [ ! -f "$target_file" ]; then
    # No existing file — just write it
    cp "$new_file" "$target_file"
    return
  fi

  # Compare what Doppler would generate vs what's on disk
  # Strip the header comments before comparing (they don't matter)
  local existing_content
  local new_content
  existing_content=$(grep -v '^#' "$target_file" | grep -v '^$' | sort)
  new_content=$(grep -v '^#' "$new_file" | grep -v '^$' | sort)

  if [ "$existing_content" = "$new_content" ]; then
    # Identical — overwrite is safe (updates header comment if needed)
    cp "$new_file" "$target_file"
    return
  fi

  # There's a difference — show the developer what changed
  HAS_DRIFT=true
  echo -e "${YELLOW}⚠${NC} ${label} has local changes not in Doppler:"

  # Show the diff (keys/values that differ)
  local diff_output
  diff_output=$(diff <(echo "$new_content") <(echo "$existing_content") 2>/dev/null || true)
  echo "$diff_output" | grep '^[<>]' | while IFS= read -r line; do
    if [[ "$line" == "< "* ]]; then
      echo -e "  ${GREEN}+ Doppler:${NC} ${line:2}"
    elif [[ "$line" == "> "* ]]; then
      echo -e "  ${RED}- Local:${NC}  ${line:2}"
    fi
  done

  echo ""
}

check_and_write "$TMPDIR_SYNC/api.env" "$REPO_ROOT/stacker-api/.env" "stacker-api/.env"
check_and_write "$TMPDIR_SYNC/ui.env" "$REPO_ROOT/stacker-ui/.env" "stacker-ui/.env"
check_and_write "$TMPDIR_SYNC/cli.env" "$REPO_ROOT/stacker-cli/.env" "stacker-cli/.env"
check_and_write "$TMPDIR_SYNC/root.env" "$REPO_ROOT/.env" "root .env"

if [ "$HAS_DRIFT" = true ]; then
  if [ "$FORCE" = true ]; then
    echo -e "${YELLOW}⚠${NC} Overwriting local changes (--force)."
    cp "$TMPDIR_SYNC/api.env" "$REPO_ROOT/stacker-api/.env"
    cp "$TMPDIR_SYNC/ui.env" "$REPO_ROOT/stacker-ui/.env"
    cp "$TMPDIR_SYNC/cli.env" "$REPO_ROOT/stacker-cli/.env"
    cp "$TMPDIR_SYNC/root.env" "$REPO_ROOT/.env"
    echo -e "${GREEN}✔${NC} .env files synced from Doppler (forced)"
  else
    echo -e "${YELLOW}⚠${NC} Some .env files have local changes that would be overwritten."
    echo "  Run 'yarn push-env' to push your changes to Doppler first,"
    echo "  or 'yarn sync-env --force' to overwrite local changes."
    echo ""
  fi
  exit 0
fi

echo -e "${GREEN}✔${NC} .env files synced from Doppler"
