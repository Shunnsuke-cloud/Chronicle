import { toNextJsHandler } from "better-auth/next-js";
import {
  databaseConfigurationMessage,
  isDatabaseConfigured,
} from "@/server/db/configuration";
import { auth } from "@/server/auth/auth";

const handlers = toNextJsHandler(auth);

function withDatabaseConfiguration<Handler extends (...args: never[]) => Response | Promise<Response>>(
  handler: Handler,
) {
  return async (...args: Parameters<Handler>) => {
    if (!isDatabaseConfigured()) {
      return Response.json(
        { error: { code: "DATABASE_NOT_CONFIGURED", message: databaseConfigurationMessage } },
        { status: 503 },
      );
    }

    return handler(...args);
  };
}

export const GET = withDatabaseConfiguration(handlers.GET);
export const POST = withDatabaseConfiguration(handlers.POST);
export const PUT = withDatabaseConfiguration(handlers.PUT);
export const PATCH = withDatabaseConfiguration(handlers.PATCH);
export const DELETE = withDatabaseConfiguration(handlers.DELETE);
