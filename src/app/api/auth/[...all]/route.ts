import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth/auth";
import { authUnavailableResponse, logServerError } from "@/server/http/server-error";

export const runtime = "nodejs";
const handlers = toNextJsHandler(auth);

function withSafeErrors(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    const path = new URL(request.url).pathname;
    const operation = path.endsWith("/sign-in/email") ? "auth_sign_in" :
      path.endsWith("/sign-up/email") ? "auth_sign_up" : "auth_request";
    try {
      const response = await handler(request);
      // Better Auth wraps create-user storage failures in a 422 API error.
      const body = response.status === 422 ? await response.clone().json().catch(() => null) : null;
      if (response.status >= 500 || body?.code === "FAILED_TO_CREATE_USER") {
        logServerError(operation, undefined);
        return authUnavailableResponse();
      }
      return response;
    } catch (error) {
      logServerError(operation, error);
      return authUnavailableResponse();
    }
  };
}

export const GET = withSafeErrors(handlers.GET);
export const POST = withSafeErrors(handlers.POST);
export const PUT = withSafeErrors(handlers.PUT);
export const PATCH = withSafeErrors(handlers.PATCH);
export const DELETE = withSafeErrors(handlers.DELETE);
