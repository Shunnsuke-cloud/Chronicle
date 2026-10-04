import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { parsePrismaEnv } from "./src/lib/prisma-env";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const datasource = parsePrismaEnv(process.env);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource,
});
