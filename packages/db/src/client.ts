import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

type PrismaGlobal = typeof globalThis & {
  __smolivePrisma?: PrismaClient;
};

/**
 * Reads `DATABASE_URL` from `process.env` and throws a descriptive error if
 * it is not set.
 *
 * Centralising the env read here means the error is thrown at the point where
 * the Prisma client is constructed (startup), rather than at the first query.
 */
function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Prisma client.");
  }

  return connectionString;
}

/**
 * Creates a new `PrismaClient` connected to the given PostgreSQL connection
 * string.
 *
 * Uses the `@prisma/adapter-pg` driver adapter (Prisma's Accelerate-compatible
 * pg adapter) so that the client works correctly in both serverless and
 * long-running Node.js environments. A new `pg.Pool` is created for each
 * client instance, so callers should avoid creating multiple clients in
 * production — use the singleton `prisma` export instead.
 *
 * `connectionString` defaults to `DATABASE_URL` from the environment via
 * `getDatabaseUrl()`.
 */
export function createPrismaClient(connectionString = getDatabaseUrl()) {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as PrismaGlobal;

/**
 * Shared singleton `PrismaClient` for the application.
 *
 * In development, the instance is stored on `globalThis` so that hot-module
 * reloads (Next.js fast refresh, Vite HMR, etc.) don't create a new database
 * connection pool on every file change. In production, a fresh instance is
 * created once at process startup and reused for the lifetime of the process.
 */
export const prisma = globalForPrisma.__smolivePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__smolivePrisma = prisma;
}

export { PrismaClient };
export type { Prisma, EmailDelivery, EmailDeliveryStatus, WaitlistEntry } from "./generated/prisma/client";
