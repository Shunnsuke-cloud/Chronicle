export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export const databaseConfigurationMessage =
  "Database is not configured. Set DATABASE_URL to your Neon PostgreSQL connection string, then run npm run prisma:deploy.";
