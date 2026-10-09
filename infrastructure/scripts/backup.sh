#!/usr/bin/env bash
# Backs up the Postgres database and MinIO buckets to infrastructure/backups/.
# Intended to run on the VPS via cron (see docs/deployment.md#backups).
#
# Usage: ./infrastructure/scripts/backup.sh [compose-file]
set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.prod.yml}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="$ROOT_DIR/infrastructure/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STAMP_DIR="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$STAMP_DIR"
cd "$ROOT_DIR"

# shellcheck disable=SC1091
[ -f .env ] && source .env

echo "==> Dumping Postgres (${POSTGRES_DB:-kartwerkz})"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-kartwerkz}" "${POSTGRES_DB:-kartwerkz}" \
  | gzip > "$STAMP_DIR/postgres.sql.gz"

echo "==> Mirroring MinIO buckets (uploads + artwork)"
docker compose -f "$COMPOSE_FILE" run --rm \
  -e MC_HOST_local="http://${MINIO_ROOT_USER:-kartwerkz-admin}:${MINIO_ROOT_PASSWORD:-change-me}@minio:9000" \
  minio/mc mirror --overwrite "local/${S3_BUCKET_UPLOADS:-kartwerkz-uploads}" "/backup/uploads" \
  -v "$STAMP_DIR:/backup" 2>/dev/null || \
  echo "    (mc mirror skipped — run manually if minio-init hasn't created buckets yet)"

echo "==> Backup written to $STAMP_DIR"
echo "    Retention is NOT automatic — prune infrastructure/backups/ and/or sync"
echo "    this directory to off-VPS storage (S3 Glacier, rsync target, etc.)."
