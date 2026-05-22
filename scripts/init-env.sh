#!/usr/bin/env bash
#
# init-env.sh — One-time environment setup for Stacker development.
#
# This script:
#   1. Ensures Doppler CLI is installed and authenticated
#   2. Creates a personal Doppler branch config (local_<username>)
#   3. Prompts for developer name/email on first run
#   4. Generates a local dev password and bcrypt hash
#   5. Stores personal values in Doppler
#   6. Generates all .env files from Doppler
#
# Usage:
#   yarn init-env              # Interactive first-time setup
#   yarn init-env --sync       # Just regenerate .env files (no prompts)
#

set -euo pipefail

DOPPLER_PROJECT="stacker"
DOPPLER_BASE_CONFIG="local"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colors ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

info()  { echo -e "${CYAN}▸${NC} $1"; }
success() { echo -e "${GREEN}✔${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✖${NC} $1" >&2; }

# ── Step 1: Check Doppler CLI ────────────────────────────────────────────────

check_doppler() {
  if ! command -v doppler &> /dev/null; then
    error "Doppler CLI is not installed."
    echo ""
    echo "  macOS:   brew install dopplerhq/cli/doppler"
    echo "  Linux:   curl -sLf --retry 3 --tlsv1.2 --proto \"=https\" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | sudo gpg --import && sudo apt install doppler"
    echo "  Windows: winget install doppler"
    echo ""
    echo "  See: https://docs.doppler.com/docs/install-cli"
    exit 1
  fi
}

check_doppler_auth() {
  if ! doppler me &> /dev/null; then
    info "Doppler CLI is not authenticated. Opening browser to log in..."
    doppler login
    if ! doppler me &> /dev/null; then
      error "Doppler authentication failed. Run 'doppler login' manually."
      exit 1
    fi
  fi
  success "Doppler authenticated"
}

# ── Step 2: Personal branch config ───────────────────────────────────────────

get_username() {
  local user
  user=$(whoami | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
  echo "$user"
}

ensure_branch_config() {
  local config_name="$1"

  if doppler configs --project "$DOPPLER_PROJECT" --json 2>/dev/null | python3 -c "
import json, sys
configs = json.load(sys.stdin)
sys.exit(0 if any(c['name'] == '$config_name' for c in configs) else 1)
" 2>/dev/null; then
    success "Doppler config '$config_name' exists"
    return 0
  fi

  info "Creating Doppler branch config '$config_name'..."
  doppler configs create --project "$DOPPLER_PROJECT" --environment "$DOPPLER_BASE_CONFIG" --name "$config_name" > /dev/null
  success "Created Doppler config '$config_name'"
}

# ── Step 3: Developer provisioning ───────────────────────────────────────────

prompt_developer_info() {
  local config_name="$1"

  echo ""
  echo -e "${CYAN}━━━ Developer Setup ━━━${NC}"
  echo ""

  # Check if personal values already exist
  local existing_email
  existing_email=$(doppler secrets get API_SEED_ADMIN_EMAIL --project "$DOPPLER_PROJECT" --config "$config_name" --plain 2>/dev/null || echo "")

  if [ -n "$existing_email" ] && [ "$SYNC_ONLY" = "false" ]; then
    echo "  Current developer: $existing_email"
    echo ""
    read -r -p "  Reconfigure? (y/N): " reconfigure
    if [[ ! "$reconfigure" =~ ^[Yy]$ ]]; then
      success "Keeping existing configuration"
      return 0
    fi
  fi

  # Prompt for info
  read -r -p "  First name: " first_name
  read -r -p "  Last name: " last_name
  read -r -p "  Email: " email

  if [ -z "$first_name" ] || [ -z "$last_name" ] || [ -z "$email" ]; then
    error "All fields are required."
    exit 1
  fi

  info "Setting up local dev account..."
  provision_dev_user "$config_name" "$first_name" "$last_name" "$email"
}

provision_dev_user() {
  local config_name="$1"
  local first_name="$2"
  local last_name="$3"
  local email="$4"

  # Generate a random password
  local password
  password=$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)

  echo ""
  echo -e "  ${YELLOW}┌─────────────────────────────────────────────┐${NC}"
  echo -e "  ${YELLOW}│  Your local dev password: ${NC}${password}${YELLOW}  │${NC}"
  echo -e "  ${YELLOW}│  Stored in Doppler. View anytime with:      │${NC}"
  echo -e "  ${YELLOW}│  doppler secrets get API_SEED_ADMIN_PASSWORD│${NC}"
  echo -e "  ${YELLOW}└─────────────────────────────────────────────┘${NC}"
  echo ""

  # Store personal values in Doppler (plain-text password — Doppler encrypts it;
  # the seed script hashes it at runtime with bcrypt)
  info "Storing personal configuration in Doppler..."
  doppler secrets set \
    --project "$DOPPLER_PROJECT" --config "$config_name" \
    API_SEED_ADMIN_EMAIL="$email" \
    API_SEED_ADMIN_FIRST_NAME="$first_name" \
    API_SEED_ADMIN_LAST_NAME="$last_name" \
    API_SEED_ADMIN_PASSWORD="$password" \
    > /dev/null

  success "Personal configuration saved to Doppler"
}

# ── Step 4: Generate .env files ──────────────────────────────────────────────

ensure_database() {
  info "Ensuring MariaDB dev container is running..."
  bash "$SCRIPT_DIR/ensure-docker-db.sh"
}

generate_env_files() {
  local config_name="$1"

  info "Generating .env files from Doppler..."

  # Fetch all secrets
  local secrets
  secrets=$(doppler secrets --project "$DOPPLER_PROJECT" --config "$config_name" --json 2>/dev/null)

  # Generate API .env
  echo "$secrets" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}
with open('$REPO_ROOT/stacker-api/.env', 'w') as f:
    f.write('# Auto-generated by init-env.sh — do not edit manually.\n')
    f.write('# Update shared values in Doppler, personal values via: yarn init-env\n\n')
    for k, v in sorted(d.items()):
        if k in skip:
            continue
        val = v.get('computed', '')
        if k.startswith('API_'):
            env_key = k[4:]  # Strip API_ prefix
            f.write(f'{env_key}=\"{val}\"\n')
"

  # Generate UI .env
  echo "$secrets" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}
with open('$REPO_ROOT/stacker-ui/.env', 'w') as f:
    f.write('# Auto-generated by init-env.sh — do not edit manually.\n')
    f.write('# Update shared values in Doppler, personal values via: yarn init-env\n\n')
    for k, v in sorted(d.items()):
        if k in skip:
            continue
        val = v.get('computed', '')
        if k.startswith('UI_'):
            env_key = k[3:]  # Strip UI_ prefix
            f.write(f'{env_key}=\"{val}\"\n')
"

  # Generate CLI .env
  echo "$secrets" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}
with open('$REPO_ROOT/stacker-cli/.env', 'w') as f:
    f.write('# Auto-generated by init-env.sh — do not edit manually.\n')
    f.write('# Update shared values in Doppler, personal values via: yarn init-env\n\n')
    for k, v in sorted(d.items()):
        if k in skip:
            continue
        val = v.get('computed', '')
        if k.startswith('CLI_'):
            env_key = k[4:]  # Strip CLI_ prefix
            f.write(f'{env_key}=\"{val}\"\n')
"

  # Generate root .env
  echo "$secrets" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}
with open('$REPO_ROOT/.env', 'w') as f:
    f.write('# Auto-generated by init-env.sh — do not edit manually.\n')
    f.write('# Update shared values in Doppler, personal values via: yarn init-env\n\n')
    for k, v in sorted(d.items()):
        if k in skip:
            continue
        val = v.get('computed', '')
        if k.startswith('ROOT_'):
            env_key = k[5:]  # Strip ROOT_ prefix
            f.write(f'{env_key}=\"{val}\"\n')
"

  success "Generated .env files:"
  echo "    $REPO_ROOT/.env"
  echo "    $REPO_ROOT/stacker-api/.env"
  echo "    $REPO_ROOT/stacker-ui/.env"
  echo "    $REPO_ROOT/stacker-cli/.env"
}

# ── Main ─────────────────────────────────────────────────────────────────────

SYNC_ONLY="false"
if [ "${1:-}" = "--sync" ]; then
  SYNC_ONLY="true"
fi

echo ""
echo -e "${CYAN}━━━ Stacker Environment Setup ━━━${NC}"
echo ""

# Step 1: Doppler
check_doppler
check_doppler_auth

# Step 2: Branch config
USERNAME=$(get_username)
CONFIG_NAME="${DOPPLER_BASE_CONFIG}_${USERNAME}"
ensure_branch_config "$CONFIG_NAME"

# Step 3: Developer info (skip if --sync)
if [ "$SYNC_ONLY" = "false" ]; then
  prompt_developer_info "$CONFIG_NAME"
fi

# Step 4: Generate .env files
generate_env_files "$CONFIG_NAME"

# Step 5: Ensure database container
ensure_database

echo ""
success "Environment setup complete!"
echo ""
echo "  Next steps:"
echo "    cd stacker-api && yarn dev    # Start the API"
echo "    cd stacker-ui && yarn dev     # Start the UI"
echo ""
