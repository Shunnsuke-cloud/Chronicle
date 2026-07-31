export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export const databaseConfigurationMessage =
  "データベースが未設定です。Neon PostgreSQL の DATABASE_URL を設定してから npm run prisma:deploy を実行してください。";
