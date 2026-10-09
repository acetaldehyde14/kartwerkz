# AGENTS.md — Kartwerkz

Operating manual for AI coding sessions (and humans) working in this repository.
Read this before making structural changes.

## What this is

Kartwerkz is a self-hosted ecommerce platform for a custom karting-graphics
business. One physical product ("Custom Kart Graphics Kit") is sold through a
live 3D configurator. Orders flow through artwork proofing/approval before
being handed to an external manufacturing supplier. This is a real commercial
build, not a prototype — treat correctness, security, and data integrity
accordingly.

## Repository layout

```
apps/
  storefront/   Next.js 15 App Router storefront (customer-facing + /admin UI)
  api/           NestJS modular monolith — the ONLY thing that talks to Postgres
  worker/        BullMQ worker process (emails, upload scanning stub)
packages/
  ui/            Shared design-system components (Radix + CVA + Tailwind)
  shared/        Cross-app TS contracts: money, enums, zod schemas, constants
  config/        Shared tsconfig + eslint flat configs
  api-client/    Typed fetch wrappers + TanStack Query hooks for the API
infrastructure/
  nginx/         dev.conf / prod.conf reverse proxy
  docker/        supporting Dockerfiles/scripts if needed
  scripts/       backup/restore and ops scripts
  backups/       local backup output (gitignored contents)
docs/            architecture, database, api, configurator, deployment, supplier docs
```

## Architectural rules (do not violate)

1. **The storefront never talks to Postgres, Redis, or MinIO directly.** All
   data access goes through the NestJS API over HTTP. The storefront holds
   zero database credentials.
2. **Modular monolith, not microservices.** `apps/api` is one deployable
   NestJS app with domain modules under `src/modules/*`. Don't split services
   out prematurely.
3. **Clean separation inside the API**: controllers are thin (validation +
   delegation only), business logic lives in services, Prisma access lives in
   services (or a thin repository layer), supplier-specific logic is isolated
   behind a `SupplierAdapter` strategy interface — never inline in the order
   controller/service.
4. **Order status only changes through `OrderStatusService.transition()`.**
   It enforces `ORDER_STATUS_TRANSITIONS` from `@kartwerkz/shared` and writes
   an `OrderStatusEvent` row every time. Do not set `order.status` directly
   anywhere else.
5. **Money is always `{ amountMinorUnits: integer, currency: string }`.**
   Never floats. Prices are always recomputed server-side at cart-add and
   checkout time — the frontend's submitted price is never trusted.
6. **Artwork approval is scoped to an exact `ArtworkRevision`.** A new
   revision supersedes prior approvals for production-eligibility purposes.
   `SENT_TO_SUPPLIER` is only reachable if the current revision has an
   `APPROVED` `ArtworkApproval`.
7. **Configuration JSON is versioned** (`schemaVersion` in
   `@kartwerkz/shared/configuration.ts`). Purchased `OrderItem` configuration
   snapshots are immutable — later catalog/pricing changes must never alter
   what was already sold.
8. **Uploaded files are private by default**, validated by MIME type and
   size, stored in MinIO/S3 under random object keys (never the client's
   filename), and served only via short-lived signed URLs to authorized
   parties. Untrusted SVGs are never executed/inlined as live DOM.

## Known placeholders / explicitly deferred work

These are intentional, documented gaps — not oversights. Don't "fix" them
without discussing scope:

- **Kart model & graphics**: the homepage/configurator 3D viewer
  (`apps/storefront/src/components/kart/`) renders a real textured GLB, but
  it's a photo-derived generic-kart approximation, not manufacturer CAD;
  `isDemo: true` rows are clearly flagged in the DB. The viewer only live-
  previews the first uploaded logo and generates its own livery graphic
  rather than reading per-region `GraphicsAsset` rows, and its panel-name
  identifiers don't match the backend's `BodyworkRegion` enum. See
  `docs/configurator.md` for the full breakdown and the real-asset import
  pipeline.
- **Stripe**: if `STRIPE_SECRET_KEY` is unset, the API falls back to a
  `DevPaymentAdapter` that never represents a real payment. Loudly logged,
  guarded by `NODE_ENV`, must not run in production.
- **Malware scanning**: `scan-upload` BullMQ job is a stub that marks assets
  `CLEAN` without real AV scanning (e.g. ClamAV). Documented TODO.
- **Guest order access**: tied to the guest-session cookie in this MVP;
  email-link verification for guest order access is a documented hardening
  TODO, not yet implemented.
- **Supplier integration**: only the `ManualFulfillmentAdapter` is
  implemented. Email/API/Webhook/Portal adapters are stubbed behind the same
  `SupplierAdapter` interface for later implementation.
- **Legal pages**: privacy/terms/shipping/returns/customization-policy are
  reasonable drafts, explicitly marked "requires legal review" in the UI.

## Commands

Run from the repo root unless noted.

```bash
pnpm install              # install all workspace deps
pnpm dev                  # turbo: run all apps in dev mode
pnpm build                # turbo: build all apps
pnpm lint                 # turbo: eslint across all apps/packages
pnpm typecheck            # turbo: tsc --noEmit across all apps/packages
pnpm test                 # turbo: unit/integration tests
pnpm test:e2e             # Playwright e2e (storefront)
pnpm format               # prettier --write
pnpm db:migrate           # prisma migrate dev (apps/api)
pnpm db:seed              # prisma db seed (apps/api)
pnpm db:studio            # prisma studio
```

### Local infrastructure

```bash
cp .env.example .env      # fill in / leave dev defaults
docker compose up -d postgres redis minio minio-init mailpit
pnpm db:migrate
pnpm db:seed
pnpm dev                  # or: docker compose up -d api worker storefront nginx
```

Storefront: http://localhost:3000 · API + Swagger: http://localhost:4000/api/docs ·
MinIO console: http://localhost:9001 · Mailpit: http://localhost:8025

## Coding conventions

- TypeScript strict mode everywhere. Avoid `any`; prefer `unknown` + narrowing
  or a proper type. Runtime validation (zod / class-validator DTOs) at every
  trust boundary (HTTP input, webhook payloads, file uploads).
- Server Components by default in the storefront; `'use client'` only where
  interactivity is required (configurator, cart, forms, animations).
- Heavy 3D (Three.js/R3F/Drei) components are dynamically imported
  (`next/dynamic`, `ssr: false`) and isolated under
  `apps/storefront/src/components/three/`.
- Naming: kebab-case files, PascalCase React components, camelCase
  functions/variables, SCREAMING_SNAKE_CASE constants, Prisma models
  PascalCase singular.
- Imports use workspace path aliases (`@/*` inside each app,
  `@kartwerkz/shared`, `@kartwerkz/ui`, `@kartwerkz/api-client` across
  packages) — no deep relative `../../../..` imports across package
  boundaries.
- Commits/PRs: small, focused, imperative subject line.

## Testing expectations

- Unit tests for pricing math, order status transitions, zod schema edge
  cases, and the configurator Zustand store.
- Integration tests (Supertest) for auth, checkout session creation, webhook
  idempotency, proof approval authorization.
- E2E (Playwright) for the golden path: homepage → configurator → add to
  cart → checkout (test mode) → order confirmation → admin proof upload →
  customer approval → production.
- Don't let placeholder/demo content block testing real logic — test the
  pricing engine and state machine thoroughly even though the kart model is a
  demo asset.

## Where to look for more detail

- `docs/architecture.md` — system overview, module boundaries, pricing engine
- `docs/database.md` — schema walkthrough and key invariants
- `docs/api.md` — REST surface, auth model, error conventions
- `docs/configurator.md` — bodywork regions, asset pipeline, schema versioning
- `docs/deployment.md` — VPS deployment, HTTPS, backups
- `docs/supplier-integration.md` — supplier adapter strategy and future
  integration methods

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
