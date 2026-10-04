import { z } from "zod";

export const databaseUrlSchema = z.string().trim().url().superRefine((value, ctx) => {
  if (!URL.canParse(value)) return;
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
    ctx.addIssue({ code: "custom", message: "Expected a PostgreSQL connection URL." });
  }
  if (url.hostname.endsWith(".neon.tech") && !["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode") ?? "")) {
    ctx.addIssue({ code: "custom", message: "Neon requires SSL." });
  }
});

export function parseServerEnv(input: Record<string, string | undefined>) {
  const production = input.NODE_ENV === "production";
  const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: databaseUrlSchema,
    BETTER_AUTH_SECRET: z.string().min(32).refine(
      (value) => !/^(replace|development-secret|change-me)/i.test(value),
    ),
    BETTER_AUTH_URL: z.string().trim().url().refine((value) => {
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return (production ? url.protocol === "https:" : ["http:", "https:"].includes(url.protocol)) &&
        !url.username && !url.password && !url.search && !url.hash && url.pathname === "/";
    }),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    // Zod errors can contain supplied values. Only report configuration keys.
    const keys = [...new Set(parsed.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Invalid server configuration: ${keys.join(", ")}. Check environment settings; values are redacted.`);
  }
  return parsed.data;
}

export function getServerEnv() {
  return parseServerEnv(process.env);
}
