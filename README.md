# Kartwerkz

Self-hosted ecommerce platform for custom karting graphics: a live 3D
configurator, order management, artwork proofing/approval, and manual
(extensible) supplier fulfillment, built as a pnpm/Turborepo monorepo.

> **Status**: active development. See [AGENTS.md](./AGENTS.md) for
> architecture, conventions, and a list of intentionally deferred work
> (demo kart assets, Stripe test mode, etc.) before assuming anything is
> production-ready.

## Stack

- **Storefront**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS,
  shadcn/ui-style components, Three.js / React Three Fiber / Drei, GSAP
  ScrollTrigger, Framer Motion, Zustand, TanStack Query, React Hook Form, Zod.
- **API**: NestJS, PostgreSQL 16, Prisma, Redis, BullMQ, Swagger/OpenAPI.
- **Infra**: Docker Compose, Nginx, MinIO (S3-compatible), GitHub Actions CI.

## Quick start

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis minio minio-init mailpit
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Storefront → http://localhost:3000
- API + Swagger docs → http://localhost:4000/api/docs
- MinIO console → http://localhost:9001
- Mailpit (dev email catcher) → http://localhost:8025

Or run everything through Docker Compose, including Nginx on
`http://localhost:8080`:

```bash
docker compose up -d
```

## Run on another machine (Docker-only, no local Node/pnpm needed)

This path only requires Docker Desktop (Windows/Mac) or Docker Engine
(Linux) — no local Node, pnpm, Postgres, or Redis install. Good for
standing the whole stack up on a second machine for local/LAN use.

```bash
git clone https://github.com/acetaldehyde14/kartwerkz.git
cd kartwerkz
cp .env.example .env
# Optional for pure local/LAN use, but recommended: replace SESSION_SECRET,
# POSTGRES_PASSWORD and MINIO_ROOT_PASSWORD with your own values in .env.

docker compose up -d --build        # builds + starts postgres, redis, minio,
                                     # mailpit, api, worker, storefront, nginx
docker compose run --rm api pnpm prisma:deploy
docker compose run --rm api pnpm prisma:seed   # optional demo data
```

- Storefront → http://localhost:3000 (or http://localhost:8080 via Nginx)
- API + Swagger docs → http://localhost:4000/api/docs
- MinIO console → http://localhost:9001
- Mailpit (dev email catcher) → http://localhost:8025

No `STRIPE_SECRET_KEY` is required — checkout automatically falls back to
a dev payment confirmation screen when it's unset (see
[docs/architecture.md](./docs/architecture.md#payments)).

**To reach it from other devices on your LAN** (not just the host
machine): set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and
`CORS_ORIGIN` in `.env` to the host machine's LAN IP instead of
`localhost` (e.g. `http://192.168.1.50:4000/api/v1`) before the first
`docker compose up --build`, since `NEXT_PUBLIC_*` values are baked into
the storefront build.

See [docs/deployment.md](./docs/deployment.md) for the production path
(real domain, TLS, live Stripe/SMTP keys) if this ever needs to go
public on the internet rather than just run locally/on a LAN.

## Scripts

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Run all apps in watch mode via Turborepo  |
| `pnpm build`      | Build all apps                            |
| `pnpm lint`       | Lint all apps/packages                    |
| `pnpm typecheck`  | Type-check all apps/packages              |
| `pnpm test`       | Unit/integration tests                    |
| `pnpm test:e2e`   | Playwright end-to-end tests (storefront)  |
| `pnpm db:migrate` | Run Prisma migrations                     |
| `pnpm db:seed`    | Seed the single demo product/kart/designs |
| `pnpm db:studio`  | Open Prisma Studio                        |

## Repository structure

See [AGENTS.md](./AGENTS.md#repository-layout) for the full breakdown and the
architectural rules every change must respect.

## Documentation

- [docs/architecture.md](./docs/architecture.md)
- [docs/database.md](./docs/database.md)
- [docs/api.md](./docs/api.md)
- [docs/configurator.md](./docs/configurator.md)
- [docs/deployment.md](./docs/deployment.md)
- [docs/supplier-integration.md](./docs/supplier-integration.md)

## License

Proprietary — all rights reserved, Kartwerkz.
