/**
 * Prisma Client Singleton for Next.js
 * src/lib/prisma.ts
 *
 * Provides runtime client routing:
 * - When DATABASE_URL points to PostgreSQL (starts with postgresql:// or postgres://),
 *   instantiates the dedicated PostgreSQL Prisma Client from src/generated/postgresql-client.
 * - Otherwise, instantiates the standard SQLite Prisma Client from @prisma/client.
 *
 * Prevents multiple instances of PrismaClient in development hot reload.
 */

import { PrismaClient as SqliteClient } from "@prisma/client";
import { PrismaClient as PgClient } from "../generated/postgresql-client";

const globalForPrisma = globalThis as unknown as {
  prisma: SqliteClient | undefined;
};

const isPostgres = Boolean(
  process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.startsWith("postgresql://") ||
      process.env.DATABASE_URL.startsWith("postgres://"))
);

function createClient(): SqliteClient {
  const logOptions =
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

  if (isPostgres) {
    return new PgClient({
      log: logOptions as ("error" | "warn")[],
    }) as unknown as SqliteClient;
  }

  return new SqliteClient({
    log: logOptions as ("query" | "error" | "warn")[],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
