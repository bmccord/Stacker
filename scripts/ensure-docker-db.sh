#!/usr/bin/env bash
#
# ensure-docker-db.sh — Ensure the local MariaDB dev container is running.
#
# Uses a named container with a named Docker volume for persistent storage.
# Data survives container restarts and recreation.
#

set -euo pipefail

CONTAINER_NAME="stacker-local-db"
VOLUME_NAME="stacker-local-data"
MARIADB_IMAGE="mariadb:11"
PORT=3306

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DB_PASSWORD=""
if [ -f "$REPO_ROOT/.env" ]; then
  DB_PASSWORD=$(grep '^DB_ROOT_PASSWORD=' "$REPO_ROOT/.env" 2>/dev/null | sed 's/^DB_ROOT_PASSWORD=//' | tr -d '"' || true)
fi
if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD="devpass123"
fi

if ! command -v docker &> /dev/null; then
  echo -e "${RED}✖${NC} Docker is not installed."
  exit 1
fi

if ! docker info &> /dev/null 2>&1; then
  echo -e "${RED}✖${NC} Docker daemon is not running."
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}✔${NC} MariaDB container '${CONTAINER_NAME}' is running"
    exit 0
  else
    echo -e "${YELLOW}▸${NC} Starting stopped MariaDB container..."
    docker start "$CONTAINER_NAME" > /dev/null
    for i in $(seq 1 30); do
      if docker exec "$CONTAINER_NAME" mariadb -uroot -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✔${NC} MariaDB container started"
        exit 0
      fi
      sleep 1
    done
    echo -e "${RED}✖${NC} MariaDB not responding after 30s"
    exit 1
  fi
fi

EXISTING_ON_PORT=$(docker ps --format '{{.Names}}' --filter "publish=3306" 2>/dev/null || true)
if [ -n "$EXISTING_ON_PORT" ]; then
  echo -e "${GREEN}✔${NC} MariaDB already running on port ${PORT}"
  exit 0
fi

echo -e "${YELLOW}▸${NC} Creating MariaDB container '${CONTAINER_NAME}'..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${PORT}:3306" \
  -e "MARIADB_ROOT_PASSWORD=${DB_PASSWORD}" \
  -v "${VOLUME_NAME}:/var/lib/mysql" \
  "$MARIADB_IMAGE" > /dev/null

echo -e "${YELLOW}▸${NC} Waiting for MariaDB..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" mariadb -uroot -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✔${NC} MariaDB container ready"
    exit 0
  fi
  sleep 1
done

echo -e "${RED}✖${NC} MariaDB not responding after 30s"
exit 1
