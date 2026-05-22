#!/usr/bin/env bash
#
# push-env.sh — Push local .env changes to Doppler.
#
# Reads all .env files, compares against Doppler, and prompts for each
# new or changed variable. New variables are classified as shared (stored
# in the base config, affects all developers) or per-developer (stored
# in the personal branch config).
#
# Usage:
#   yarn push-env
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
DIM='\033[2m'
NC='\033[0m'

info()    { echo -e "${CYAN}▸${NC} $1"; }
success() { echo -e "${GREEN}✔${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✖${NC} $1" >&2; }

# ── Preflight checks ────────────────────────────────────────────────────────

if ! command -v doppler &> /dev/null; then
  error "Doppler CLI not installed. Run 'yarn init-env' first."
  exit 1
fi

if ! doppler me &> /dev/null; then
  error "Doppler not authenticated. Run 'doppler login' or 'yarn init-env'."
  exit 1
fi

USERNAME=$(whoami | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
BRANCH_CONFIG="${DOPPLER_BASE_CONFIG}_${USERNAME}"

if ! doppler configs --project "$DOPPLER_PROJECT" --json 2>/dev/null | python3 -c "
import json, sys
configs = json.load(sys.stdin)
sys.exit(0 if any(c['name'] == '$BRANCH_CONFIG' for c in configs) else 1)
" 2>/dev/null; then
  error "Doppler config '$BRANCH_CONFIG' not found. Run 'yarn init-env' first."
  exit 1
fi

# ── Fetch current Doppler state ─────────────────────────────────────────────

info "Fetching current secrets from Doppler..."

TMPDIR_PUSH=$(mktemp -d)
trap "rm -rf $TMPDIR_PUSH" EXIT

# Dump Doppler values to temp files for lookup
doppler secrets --project "$DOPPLER_PROJECT" --config "$BRANCH_CONFIG" --json 2>/dev/null | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}
with open('$TMPDIR_PUSH/branch_values.txt', 'w') as f:
    for k, v in sorted(d.items()):
        if k not in skip:
            f.write(f'{k}={v.get(\"computed\", \"\")}\n')
"

doppler secrets --project "$DOPPLER_PROJECT" --config "$DOPPLER_BASE_CONFIG" --json 2>/dev/null | python3 -c "
import json, sys
d = json.load(sys.stdin)
skip = {'DOPPLER_CONFIG', 'DOPPLER_ENVIRONMENT', 'DOPPLER_PROJECT'}
with open('$TMPDIR_PUSH/shared_keys.txt', 'w') as f:
    for k in sorted(d.keys()):
        if k not in skip:
            f.write(k + '\n')
"

# Collect changes into temp files
> "$TMPDIR_PUSH/shared_updates.txt"
> "$TMPDIR_PUSH/personal_updates.txt"
TOTAL_CHANGES=0

# ── Process each .env file ──────────────────────────────────────────────────

process_env_file() {
  local env_file="$1"
  local prefix="$2"
  local project_label="$3"

  if [ ! -f "$env_file" ]; then
    return
  fi

  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    # Parse KEY=VALUE
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*) ]]; then
      local_key="${BASH_REMATCH[1]}"
      local_value="${BASH_REMATCH[2]}"

      # Strip surrounding quotes
      local_value="${local_value#\"}"
      local_value="${local_value%\"}"
      local_value="${local_value#\'}"
      local_value="${local_value%\'}"

      doppler_key="${prefix}${local_key}"

      # Look up current value
      current_line=$(grep "^${doppler_key}=" "$TMPDIR_PUSH/branch_values.txt" 2>/dev/null || true)

      if [ -z "$current_line" ]; then
        # New variable
        echo ""
        info "New variable: ${CYAN}${local_key}${NC} (from ${project_label})"
        echo -e "  Value: ${DIM}${local_value}${NC}"
        echo ""
        echo "  1) Shared (all developers)"
        echo "  2) Per-developer (only you)"
        echo "  3) Skip"
        read -r -p "  Choice [1/2/3]: " choice

        case "$choice" in
          1)
            echo "${doppler_key}=${local_value}" >> "$TMPDIR_PUSH/shared_updates.txt"
            TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
            ;;
          2)
            echo "${doppler_key}=${local_value}" >> "$TMPDIR_PUSH/personal_updates.txt"
            TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
            ;;
          *) info "Skipping $local_key" ;;
        esac
      else
        # Existing variable — check if value changed
        current_value="${current_line#*=}"

        if [ "$current_value" != "$local_value" ]; then
          echo ""
          info "Changed variable: ${CYAN}${local_key}${NC} (from ${project_label})"
          echo -e "  Doppler: ${DIM}${current_value}${NC}"
          echo -e "  Local:   ${DIM}${local_value}${NC}"

          # Check if shared or personal
          if grep -q "^${doppler_key}$" "$TMPDIR_PUSH/shared_keys.txt" 2>/dev/null; then
            echo ""
            echo -e "  ${YELLOW}This is a shared variable — updating will affect all developers.${NC}"
            read -r -p "  Update in Doppler? (y/N): " confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
              echo "${doppler_key}=${local_value}" >> "$TMPDIR_PUSH/shared_updates.txt"
              TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
            fi
          else
            read -r -p "  Update your personal config? (y/N): " confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
              echo "${doppler_key}=${local_value}" >> "$TMPDIR_PUSH/personal_updates.txt"
              TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
            fi
          fi
        fi
      fi
    fi
  done < "$env_file"
}

# Process known .env files
process_env_file "$REPO_ROOT/stacker-api/.env" "API_" "stacker-api"
process_env_file "$REPO_ROOT/stacker-ui/.env" "UI_" "stacker-ui"
process_env_file "$REPO_ROOT/stacker-cli/.env" "CLI_" "stacker-cli"
process_env_file "$REPO_ROOT/.env" "ROOT_" "root"

# Scan for new project .env files
for dir in "$REPO_ROOT"/stacker-*/; do
  project_name=$(basename "$dir")
  env_file="$dir.env"

  # Skip known projects
  case "$project_name" in
    stacker-api|stacker-ui|stacker-cli|stacker-docs) continue ;;
  esac

  if [ -f "$env_file" ]; then
    echo ""
    warn "Found .env in new project: $project_name"
    read -r -p "  Doppler prefix (e.g., NEWPROJ_), or press Enter to skip: " new_prefix
    if [ -n "$new_prefix" ]; then
      [[ "$new_prefix" != *_ ]] && new_prefix="${new_prefix}_"
      process_env_file "$env_file" "$new_prefix" "$project_name"
    fi
  fi
done

# ── Apply changes ────────────────────────────────────────────────────────────

if [ "$TOTAL_CHANGES" -eq 0 ]; then
  echo ""
  success "All .env files are in sync with Doppler. Nothing to push."
  exit 0
fi

# Push shared updates
if [ -s "$TMPDIR_PUSH/shared_updates.txt" ]; then
  shared_args=()
  while IFS= read -r line; do
    shared_args+=("$line")
  done < "$TMPDIR_PUSH/shared_updates.txt"

  count=${#shared_args[@]}
  info "Pushing $count shared variable(s) to Doppler..."
  doppler secrets set --project "$DOPPLER_PROJECT" --config "$DOPPLER_BASE_CONFIG" "${shared_args[@]}" > /dev/null
  success "Shared variables updated"
fi

# Push personal updates
if [ -s "$TMPDIR_PUSH/personal_updates.txt" ]; then
  personal_args=()
  while IFS= read -r line; do
    personal_args+=("$line")
  done < "$TMPDIR_PUSH/personal_updates.txt"

  count=${#personal_args[@]}
  info "Pushing $count personal variable(s) to Doppler..."
  doppler secrets set --project "$DOPPLER_PROJECT" --config "$BRANCH_CONFIG" "${personal_args[@]}" > /dev/null
  success "Personal variables updated"
fi

echo ""
success "Done — $TOTAL_CHANGES variable(s) pushed to Doppler."
echo ""
