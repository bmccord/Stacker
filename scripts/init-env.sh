#!/usr/bin/env bash
#
# init-env.sh — One-time environment setup for Stacker development.
#
# Two modes:
#   1. With Doppler: Creates a personal branch config, stores secrets in Doppler,
#      and generates .env files from it. Best for teams.
#   2. Without Doppler: Generates .env files locally with auto-generated secrets.
#      Works out of the box for solo developers or quick starts.
#
# Usage:
#   yarn init-env              # Interactive first-time setup
#   yarn init-env --sync       # Just regenerate .env files (no prompts)
#   yarn init-env --local      # Force local mode (skip Doppler even if installed)
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

# ── Parse flags ──────────────────────────────────────────────────────────────

SYNC_ONLY="false"
FORCE_LOCAL="false"
for arg in "$@"; do
  case "$arg" in
    --sync) SYNC_ONLY="true" ;;
    --local) FORCE_LOCAL="true" ;;
  esac
done

# ── Detect Doppler availability ──────────────────────────────────────────────

USE_DOPPLER="false"

detect_doppler() {
  if [ "$FORCE_LOCAL" = "true" ]; then
    info "Local mode (--local flag)"
    return
  fi

  if ! command -v doppler &> /dev/null; then
    warn "Doppler CLI not installed — using local mode."
    echo "  To use Doppler for team secrets management, install it:"
    echo "  macOS:   brew install dopplerhq/cli/doppler"
    echo ""
    return
  fi

  if ! doppler me &> /dev/null; then
    echo ""
    echo -e "  Doppler CLI is installed but not authenticated."
    echo ""
    echo "  1) Set up Doppler (recommended for teams)"
    echo "  2) Skip Doppler — generate .env files locally"
    echo ""
    read -r -p "  Choice [1/2]: " doppler_choice
    if [ "$doppler_choice" = "1" ]; then
      info "Opening browser to log in..."
      doppler login
      if ! doppler me &> /dev/null; then
        error "Doppler authentication failed. Falling back to local mode."
        return
      fi
      USE_DOPPLER="true"
    else
      info "Using local mode."
    fi
    return
  fi

  USE_DOPPLER="true"
  success "Doppler authenticated"
}

# ── Doppler helpers ──────────────────────────────────────────────────────────

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

# ── Developer prompts (shared by both modes) ─────────────────────────────────

prompt_developer_info() {
  echo ""
  echo -e "${CYAN}━━━ Developer Setup ━━━${NC}"
  echo ""

  # Check if .env already has values (local mode reconfigure check)
  if [ -f "$REPO_ROOT/stacker-api/.env" ]; then
    local existing_email
    existing_email=$(grep '^SEED_ADMIN_EMAIL=' "$REPO_ROOT/stacker-api/.env" 2>/dev/null | sed 's/^SEED_ADMIN_EMAIL=//' | tr -d '"' || echo "")
    if [ -n "$existing_email" ] && [ "$existing_email" != "admin@example.com" ]; then
      echo "  Current developer: $existing_email"
      echo ""
      read -r -p "  Reconfigure? (y/N): " reconfigure
      if [[ ! "$reconfigure" =~ ^[Yy]$ ]]; then
        success "Keeping existing configuration"
        return 1  # Signal: skip provisioning
      fi
    fi
  fi

  read -r -p "  First name: " SETUP_FIRST_NAME
  read -r -p "  Last name: " SETUP_LAST_NAME
  read -r -p "  Email: " SETUP_EMAIL

  if [ -z "$SETUP_FIRST_NAME" ] || [ -z "$SETUP_LAST_NAME" ] || [ -z "$SETUP_EMAIL" ]; then
    error "All fields are required."
    exit 1
  fi

  # Generate a random password
  SETUP_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)

  echo ""
  echo -e "  ${YELLOW}┌─────────────────────────────────────────────────┐${NC}"
  echo -e "  ${YELLOW}│  Your local dev password: ${NC}${SETUP_PASSWORD}"
  echo -e "  ${YELLOW}│  Saved in stacker-api/.env (SEED_ADMIN_PASSWORD)│${NC}"
  echo -e "  ${YELLOW}└─────────────────────────────────────────────────┘${NC}"
  echo ""

  return 0
}

# ── Doppler mode: store in Doppler + generate from Doppler ───────────────────

doppler_provision() {
  local config_name="$1"

  info "Storing personal configuration in Doppler..."
  doppler secrets set \
    --project "$DOPPLER_PROJECT" --config "$config_name" \
    API_SEED_ADMIN_EMAIL="$SETUP_EMAIL" \
    API_SEED_ADMIN_FIRST_NAME="$SETUP_FIRST_NAME" \
    API_SEED_ADMIN_LAST_NAME="$SETUP_LAST_NAME" \
    API_SEED_ADMIN_PASSWORD="$SETUP_PASSWORD" \
    > /dev/null

  success "Personal configuration saved to Doppler"
}

doppler_generate_env_files() {
  local config_name="$1"

  info "Generating .env files from Doppler..."

  local secrets
  secrets=$(doppler secrets --project "$DOPPLER_PROJECT" --config "$config_name" --json 2>/dev/null)

  echo "$secrets" | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}

def write_env(path, prefix, header):
    with open(path, 'w') as f:
        f.write(header)
        for k, v in sorted(d.items()):
            if k in skip:
                continue
            val = v.get('computed', '')
            if k.startswith(prefix):
                env_key = k[len(prefix):]
                f.write(f'{env_key}=\"{val}\"\n')

hdr = '# Auto-generated by init-env.sh from Doppler — do not edit manually.\n# Update via Doppler or run: yarn push-env\n\n'
write_env('$REPO_ROOT/stacker-api/.env', 'API_', hdr)
write_env('$REPO_ROOT/stacker-ui/.env', 'UI_', hdr)
write_env('$REPO_ROOT/stacker-cli/.env', 'CLI_', hdr)
write_env('$REPO_ROOT/.env', 'ROOT_', hdr)
"

  success "Generated .env files from Doppler"
}

# ── Local mode: generate .env files directly ─────────────────────────────────

local_generate_env_files() {
  info "Generating .env files locally..."

  # Generate secrets
  local jwt_secret
  jwt_secret=$(openssl rand -base64 32)
  local api_key
  api_key="sk-$(openssl rand -hex 16)"
  local db_password="devpass123"

  # stacker-api/.env
  cat > "$REPO_ROOT/stacker-api/.env" << ENVEOF
# Generated by init-env.sh (local mode).
# To switch to Doppler, run: yarn init-env (with Doppler CLI installed)

DATABASE_URL="mysql://root:${db_password}@127.0.0.1:3306/stacker-local"
JWT_SECRET="${jwt_secret}"
PORT="4000"
DEV_ADMIN_USER_ID="dev-admin"
STACKER_API_KEY="${api_key}"
SEED_ADMIN_EMAIL="${SETUP_EMAIL}"
SEED_ADMIN_PASSWORD="${SETUP_PASSWORD}"
SEED_ADMIN_FIRST_NAME="${SETUP_FIRST_NAME}"
SEED_ADMIN_LAST_NAME="${SETUP_LAST_NAME}"
ENVEOF

  # stacker-ui/.env
  cat > "$REPO_ROOT/stacker-ui/.env" << ENVEOF
# Generated by init-env.sh (local mode).

VITE_API_URL="http://localhost:4000/graphql"
ENVEOF

  # stacker-cli/.env
  cat > "$REPO_ROOT/stacker-cli/.env" << ENVEOF
# Generated by init-env.sh (local mode).

STACKER_API_URL="http://localhost:4000/graphql"
STACKER_API_KEY="${api_key}"
ENVEOF

  # root .env
  cat > "$REPO_ROOT/.env" << ENVEOF
# Generated by init-env.sh (local mode).

DB_ROOT_PASSWORD="${db_password}"
ENVEOF

  success "Generated .env files locally"
}

# ── Ensure database ─────────────────────────────────────────────────────────

ensure_database() {
  info "Ensuring MariaDB dev container is running..."
  bash "$SCRIPT_DIR/ensure-docker-db.sh"
}

# ── Main ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}━━━ Stacker Environment Setup ━━━${NC}"
echo ""

# Step 1: Detect Doppler
detect_doppler

if [ "$USE_DOPPLER" = "true" ]; then
  # ── Doppler path ──────────────────────────────────────────────────────────

  USERNAME=$(get_username)
  CONFIG_NAME="${DOPPLER_BASE_CONFIG}_${USERNAME}"
  ensure_branch_config "$CONFIG_NAME"

  if [ "$SYNC_ONLY" = "false" ]; then
    # Check if personal values already exist in Doppler
    existing_email=$(doppler secrets get API_SEED_ADMIN_EMAIL --project "$DOPPLER_PROJECT" --config "$CONFIG_NAME" --plain 2>/dev/null || echo "")

    if [ -n "$existing_email" ]; then
      echo ""
      echo "  Current developer: $existing_email"
      echo ""
      read -r -p "  Reconfigure? (y/N): " reconfigure
      if [[ "$reconfigure" =~ ^[Yy]$ ]]; then
        if prompt_developer_info; then
          doppler_provision "$CONFIG_NAME"
        fi
      else
        success "Keeping existing configuration"
      fi
    else
      if prompt_developer_info; then
        doppler_provision "$CONFIG_NAME"
      fi
    fi
  fi

  doppler_generate_env_files "$CONFIG_NAME"

else
  # ── Local path ────────────────────────────────────────────────────────────

  if [ "$SYNC_ONLY" = "true" ]; then
    # In local mode, --sync just verifies .env files exist
    if [ -f "$REPO_ROOT/stacker-api/.env" ]; then
      success ".env files already exist (local mode, nothing to sync)"
    else
      warn "No .env files found. Run 'yarn init-env' without --sync."
      exit 1
    fi
  else
    if prompt_developer_info; then
      local_generate_env_files
    else
      # User chose not to reconfigure — leave existing files alone
      success "Keeping existing .env files"
    fi
  fi
fi

# Step 5: Ensure database container
ensure_database

echo ""
success "Environment setup complete!"
echo ""
echo "  Next steps:"
echo "    cd stacker-api && yarn dev    # Start the API"
echo "    cd stacker-ui && yarn dev     # Start the UI"
echo ""
