import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/db/prisma";
import { getServerEnv } from "@/lib/env";
import { logServerError } from "@/server/http/server-error";

const env = getServerEnv();

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  logger: { log: (level, _message, ...args) => {
    if (level === "error" || level === "warn") logServerError("better_auth", args.find((arg) => arg instanceof Error));
  } },
  onAPIError: { onError: (error) => logServerError("better_auth_api", error) },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    modelName: "user",
  },
  session: {
    modelName: "session",
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
