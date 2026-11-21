import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load local PostgreSQL environment variables if present
dotenv.config({ path: ".env.production.local" });

// Explicitly validate DIRECT_URL for migrations — no fallbacks to localhost or pooled runtime URLs
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error(
    "DIRECT_URL is required for PostgreSQL migrations. Please configure DIRECT_URL in .env.production.local or process environment."
  );
}

export default defineConfig({
  schema: "prisma/schema.postgresql.prisma",
  migrations: {
    path: "prisma/migrations_postgresql",
    seed: "tsx prisma/seed.postgresql.ts",
  },
  datasource: {
    url: directUrl,
  },
});
