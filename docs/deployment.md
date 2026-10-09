# Deployment

Target: a single Linux VPS running Docker Compose, with room to split
services onto separate hosts later (each service is already a separate
container with its own image; moving Postgres to a managed RDS-style host
later only means changing `DATABASE_URL`).

## Do not consider this production-ready until

- [ ] Real TLS certificates are provisioned (see HTTPS below) — not the
      placeholder paths in `infrastructure/nginx/prod.conf`.
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`
      are set to **live** keys (test-mode keys are fine for staging only).
- [ ] All `.env` secrets are rotated from the `.env.example` dev defaults
      (`POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `SESSION_SECRET`).
- [ ] A backup has been taken AND a restore has been successfully tested
      (see below) — an untested backup is not a backup.
- [ ] Real commercial pricing has replaced `DEV_BASE_PRICE_MINOR_UNITS`.
- [ ] SMTP credentials point at a real provider, not Mailpit.
- [ ] A security review has been done (see `docs/architecture.md` and the
      OWASP-relevant items in `AGENTS.md`).

## VPS setup

```bash
# On the VPS
git clone <repo> /opt/kartwerkz && cd /opt/kartwerkz
cp .env.example .env
nano .env   # fill in real secrets, PUBLIC_DOMAIN, Stripe/SMTP keys

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d postgres redis minio
docker compose -f docker-compose.prod.yml run --rm api pnpm prisma:deploy
docker compose -f docker-compose.prod.yml run --rm api pnpm prisma:seed   # optional
docker compose -f docker-compose.prod.yml up -d
```

Postgres, Redis, and MinIO are **not** published on the host in
`docker-compose.prod.yml` — only Nginx's 80/443 are. All inter-service
traffic stays on the Compose-internal network.

## HTTPS

`infrastructure/nginx/prod.conf` expects certs at
`infrastructure/nginx/certs/{fullchain,privkey}.pem`. Recommended path:
Certbot in standalone/webroot mode against the `/.well-known/acme-challenge/`
location already proxied in the HTTP server block, then symlink/copy the
issued cert pair into `infrastructure/nginx/certs/` and reload Nginx
(`docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`).
Set up a renewal cron (Certbot's default timer or a monthly cron calling
`certbot renew` + the Nginx reload).

## Zero-downtime-ish deploys

Single VPS without a load balancer means brief downtime on `storefront`/`api`
restarts is expected initially. For a given release:

```bash
git pull
docker compose -f docker-compose.prod.yml build api worker storefront
docker compose -f docker-compose.prod.yml run --rm api pnpm prisma:deploy
docker compose -f docker-compose.prod.yml up -d api worker storefront
```

## Backups

```bash
./infrastructure/scripts/backup.sh docker-compose.prod.yml
```

Dumps Postgres (`pg_dump`, gzipped) and mirrors the MinIO
uploads/artwork buckets into `infrastructure/backups/<UTC timestamp>/`.
**This directory is local to the VPS** — schedule a cron copying it
off-box (rsync to another host, or `mc mirror` to a separate S3-compatible
target) since a VPS-local-only backup doesn't survive VPS loss. Suggested
cron: daily at 03:00 UTC, retain 14 days locally, retain longer off-box.

```cron
0 3 * * * cd /opt/kartwerkz && ./infrastructure/scripts/backup.sh docker-compose.prod.yml >> /var/log/kartwerkz-backup.log 2>&1
```

## Restore procedure

**Always test this on staging before you need it for real.**

```bash
./infrastructure/scripts/restore.sh infrastructure/backups/<timestamp>/postgres.sql.gz docker-compose.prod.yml
# then separately restore MinIO:
docker compose -f docker-compose.prod.yml run --rm minio/mc \
  mirror /backup/uploads local/kartwerkz-uploads
```

The script prompts for confirmation before dropping the target database —
there is no `--force` flag by design.

## Moving to multiple servers later

Because every stateful dependency is reached only via a URL/credential in
`.env` (`DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`), migrating e.g. Postgres
to a managed host is a config change, not a code change: point
`DATABASE_URL` at the new host, run `prisma migrate deploy` against it, then
cut over. The same is true for Redis and S3-compatible storage (MinIO's
S3 API is what the app talks to — swapping to a real S3/R2/Spaces bucket
just means changing `S3_ENDPOINT`/credentials).
