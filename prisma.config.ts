import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Add your Neon PostgreSQL connection string to .env.local before running Prisma commands.",
  );
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
