# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Kartwerkz storefront (Next.js App Router) — multi-stage Dockerfile.
# Build from the MONOREPO ROOT so the pnpm workspace + packages/* deps
# resolve correctly, e.g.:
#   docker build -f apps/storefront/Dockerfile -t kartwerkz-storefront .
# ---------------------------------------------------------------------------

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# --- deps: install workspace dependencies ---------------------------------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/storefront/package.json ./apps/storefront/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN pnpm install --frozen-lockfile

# --- dev: `next dev` with live reload, source mounted via docker-compose --
FROM deps AS dev
WORKDIR /repo
COPY . .
RUN pnpm --filter @kartwerkz/shared build
WORKDIR /repo/apps/storefront
EXPOSE 3000
CMD ["pnpm", "dev"]

# --- builder: full `next build` (standalone output) -----------------------
FROM deps AS builder
WORKDIR /repo
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# @kartwerkz/shared ships a compiled dist/ (see AGENTS.md) that Next's build
# resolves via its package.json "main" — must exist before `next build` traces it.
RUN pnpm --filter @kartwerkz/shared build
RUN pnpm --filter @kartwerkz/storefront build

# --- production: minimal runtime image from the standalone output ---------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /repo/apps/storefront/public ./public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/static ./apps/storefront/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/storefront/server.js"]
