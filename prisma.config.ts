import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { databaseUrlSchema } from "./src/lib/env";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const databaseUrl = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Add your Neon PostgreSQL connection string to .env.local before running Prisma commands.",
  );
}

if (!databaseUrlSchema.safeParse(databaseUrl).success ||
  (process.env.SHADOW_DATABASE_URL && !databaseUrlSchema.safeParse(process.env.SHADOW_DATABASE_URL).success)) {
  throw new Error("Invalid Prisma database configuration. Check DATABASE_URL / DIRECT_URL / SHADOW_DATABASE_URL (values redacted).");
}

const datasource = {
  url: databaseUrl,
  ...(process.env.SHADOW_DATABASE_URL
    ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
    : {}),
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource,
});
