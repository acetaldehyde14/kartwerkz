# syntax=docker/dockerfile:1

# --- base: shared dependency layer -----------------------------------------
FROM node:20.18.0-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/config/package.json packages/config/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter @kartwerkz/worker... || pnpm install --no-frozen-lockfile --filter @kartwerkz/worker...

# --- dev: auto-reloading worker process --------------------------------------
FROM base AS dev
WORKDIR /app
COPY . .
RUN pnpm --filter @kartwerkz/worker prisma:generate
WORKDIR /app/apps/worker
CMD ["pnpm", "dev"]

# --- builder: compiles TypeScript to dist -----------------------------------
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm --filter @kartwerkz/worker prisma:generate
RUN pnpm --filter @kartwerkz/worker build

# --- production: minimal runtime image --------------------------------------
FROM node:20.18.0-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-workspace.yaml ./
COPY packages/config/package.json packages/config/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --prod --frozen-lockfile --filter @kartwerkz/worker... || pnpm install --prod --no-frozen-lockfile --filter @kartwerkz/worker...
COPY --from=builder /app/apps/worker/dist /app/apps/worker/dist
COPY --from=builder /app/apps/worker/node_modules/.prisma /app/apps/worker/node_modules/.prisma
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
