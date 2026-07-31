import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasource = {
  url:
    process.env.DATABASE_URL ??
    "postgresql://chronicle:chronicle@localhost:5432/chronicle",
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
