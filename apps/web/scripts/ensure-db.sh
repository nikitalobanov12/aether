#!/usr/bin/env bash
# Ensures the database is running before starting the dev server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Load env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Check if using a remote database (Neon, Supabase, etc.)
# Remote databases typically have hostnames like *.neon.tech, *.supabase.co, etc.
if echo "$DATABASE_URL" | grep -qE "(neon\.tech|supabase\.co|supabase\.com|railway\.app|planetscale\.com|cockroachlabs\.cloud)"; then
  echo -e "${GREEN}Using remote database - skipping local container check${NC}"
  exit 0
fi

# Extract DB name safely - handle URLs with query params
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*://[^/]+/([^?]+).*|\1|')
DB_CONTAINER_NAME="${DB_NAME:-dayflow}-postgres"

# Validate container name (only allow alphanumeric, dash, underscore, dot)
if ! echo "$DB_CONTAINER_NAME" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9_.-]*$'; then
  echo -e "${YELLOW}Invalid container name derived from DATABASE_URL. Assuming external database.${NC}"
  exit 0
fi

# Determine docker command
if [ -x "$(command -v docker)" ]; then
  DOCKER_CMD="docker"
elif [ -x "$(command -v podman)" ]; then
  DOCKER_CMD="podman"
else
  echo -e "${YELLOW}Docker/Podman not found. Assuming external database.${NC}"
  exit 0
fi

# Check if docker daemon is running
if ! $DOCKER_CMD info > /dev/null 2>&1; then
  echo -e "${YELLOW}Docker daemon not running. Assuming external database.${NC}"
  exit 0
fi

# Check if container is already running
if [ "$($DOCKER_CMD ps -q -f name="^${DB_CONTAINER_NAME}$")" ]; then
  echo -e "${GREEN}Database already running${NC}"
  exit 0
fi

# Check if container exists but is stopped
if [ "$($DOCKER_CMD ps -q -a -f name="^${DB_CONTAINER_NAME}$")" ]; then
  echo -e "${YELLOW}Starting existing database container...${NC}"
  $DOCKER_CMD start "$DB_CONTAINER_NAME" > /dev/null
  echo -e "${GREEN}Database started${NC}"
  # Wait for postgres to be ready
  sleep 2
  exit 0
fi

# No container exists - run the full setup script
echo -e "${YELLOW}No database container found. Running setup...${NC}"
./start-database.sh
