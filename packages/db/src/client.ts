import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

type PrismaGlobal = typeof globalThis & {
  __smolivePrisma?: PrismaClient;
};

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Prisma client.");
  }

  return connectionString;
}

export function createPrismaClient(connectionString = getDatabaseUrl()) {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as PrismaGlobal;

export const prisma = globalForPrisma.__smolivePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__smolivePrisma = prisma;
}

export { PrismaClient };
export type { Prisma, EmailDelivery, EmailDeliveryStatus } from "./generated/prisma/client";
