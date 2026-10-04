import { databaseUrlSchema } from "./env";

export function parsePrismaEnv(input: Record<string, string | undefined>) {
  const key = input.DIRECT_URL?.trim() ? "DIRECT_URL" : "DATABASE_URL";
  const url = validateUrl(key, input[key]);
  const shadow = input.SHADOW_DATABASE_URL?.trim();
  return {
    url,
    ...(shadow ? { shadowDatabaseUrl: validateUrl("SHADOW_DATABASE_URL", shadow) } : {}),
  };
}

function validateUrl(key: string, value: string | undefined) {
  if (!value?.trim()) {
    throw new Error(`${key} is required. Set it in Render Environment or .env.local (values redacted).`);
  }
  const parsed = databaseUrlSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${key}: expected a postgres:// or postgresql:// URL with a hostname and database name. In Render enter only the URL, without DATABASE_URL=, shell commands, or surrounding quotes. Remove unused optional URL settings. Values are redacted.`);
  }
  return parsed.data;
}
