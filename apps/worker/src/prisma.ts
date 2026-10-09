import { PrismaClient } from '@prisma/client';

/**
 * The worker's own PrismaClient instance, generated from the SAME schema as
 * the API (apps/api/prisma/schema.prisma) — see package.json's
 * `prisma:generate` script, which points `--schema` at that file via a
 * relative path. We chose "worker owns its own @prisma/client dependency
 * and generates against the API's schema" over "share the API's generated
 * client via a cross-package node_modules reach" because it's simpler and
 * keeps apps/worker independently installable/buildable — the tradeoff is
 * that `pnpm --filter @kartwerkz/worker prisma:generate` must be run
 * whenever the schema changes (same as the API).
 */
export const prisma = new PrismaClient();
