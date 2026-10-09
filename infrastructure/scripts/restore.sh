#!/usr/bin/env bash
# Restores a Postgres dump produced by backup.sh. DESTRUCTIVE — overwrites
# the target database. Always test restores on a non-production environment
# first. See docs/deployment.md#restore-procedure.
#
# Usage: ./infrastructure/scripts/restore.sh <path-to-postgres.sql.gz> [compose-file]
set -euo pipefail

DUMP_FILE="${1:?Usage: restore.sh <path-to-postgres.sql.gz> [compose-file]}"
COMPOSE_FILE="${2:-docker-compose.prod.yml}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# shellcheck disable=SC1091
[ -f .env ] && source .env

if [ ! -f "$DUMP_FILE" ]; then
  echo "Dump file not found: $DUMP_FILE" >&2
  exit 1
fi

read -r -p "This will DROP and recreate ${POSTGRES_DB:-kartwerkz}. Continue? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

echo "==> Dropping and recreating database"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "${POSTGRES_USER:-kartwerkz}" -d postgres \
  -c "DROP DATABASE IF EXISTS \"${POSTGRES_DB:-kartwerkz}\";" \
  -c "CREATE DATABASE \"${POSTGRES_DB:-kartwerkz}\" OWNER \"${POSTGRES_USER:-kartwerkz}\";"

echo "==> Restoring from $DUMP_FILE"
gunzip -c "$DUMP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "${POSTGRES_USER:-kartwerkz}" -d "${POSTGRES_DB:-kartwerkz}"

echo "==> Restore complete. Remember to separately restore MinIO buckets from"
echo "    the corresponding backups/<timestamp>/uploads directory with 'mc mirror'."
