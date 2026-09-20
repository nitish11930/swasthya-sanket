/**
 * Prisma Client Singleton
 *
 * Standard Next.js pattern to prevent multiple Prisma Client instances
 * in development hot-reloading.
 *
 * Phase 0: DATABASE_URL not configured — PrismaClient is instantiated
 * but no DB calls are made. Calls will fail until .env.local is set up
 * and migrations run (Phase 1).
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
