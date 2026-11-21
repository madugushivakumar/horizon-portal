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
  // Fail-closed guard: enforce Preview environment isolation and reject Production endpoint
  if (process.env.VERCEL_ENV === "preview") {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "CONFIGURATION ERROR: VERCEL_ENV is 'preview' but DATABASE_URL is missing. Preview requires dedicated Preview PostgreSQL credentials."
      );
    }
    if (process.env.DATABASE_URL.includes("ep-broad-hall-b3dtqwdp")) {
      throw new Error(
        "SECURITY VIOLATION: Vercel Preview environment is configured with Production PostgreSQL endpoint (ep-broad-hall-b3dtqwdp). Refusing to connect to prevent accidental production state mutation."
      );
    }
    if (
      process.env.EXPECTED_PREVIEW_ENDPOINT &&
      !process.env.DATABASE_URL.includes(process.env.EXPECTED_PREVIEW_ENDPOINT)
    ) {
      throw new Error(
        `SECURITY VIOLATION: Preview database endpoint mismatch. Expected endpoint matching '${process.env.EXPECTED_PREVIEW_ENDPOINT}'.`
      );
    }
  }

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
