# syntax=docker/dockerfile:1

# --- base: shared dependency layer -----------------------------------------
FROM node:20.18.0-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @kartwerkz/api... || pnpm install --no-frozen-lockfile --filter @kartwerkz/api...

# --- dev: hot-reloading NestJS process --------------------------------------
FROM base AS dev
WORKDIR /app
COPY . .
# @kartwerkz/shared ships a compiled CommonJS dist/ (see packages/shared/README
# note in AGENTS.md) — required so `require('@kartwerkz/shared')` resolves to
# plain JS instead of a raw .ts file ts-node can't load across the symlink.
RUN pnpm --filter @kartwerkz/shared build
RUN pnpm --filter @kartwerkz/api prisma:generate
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["pnpm", "dev"]

# --- builder: compiles TypeScript to dist -----------------------------------
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm --filter @kartwerkz/shared build
RUN pnpm --filter @kartwerkz/api prisma:generate
RUN pnpm --filter @kartwerkz/api build

# --- production: minimal runtime image --------------------------------------
FROM node:20.18.0-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --prod --frozen-lockfile --filter @kartwerkz/api... || pnpm install --prod --no-frozen-lockfile --filter @kartwerkz/api...
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/api/prisma /app/apps/api/prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
