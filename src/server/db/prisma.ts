import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const env = getServerEnv();
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000, max: 10, idleTimeoutMillis: 30000, statement_timeout: 10000 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter, log: [] });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
