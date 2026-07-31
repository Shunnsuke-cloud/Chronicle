import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  CommandAuthorizationError,
  CommandNotFoundError,
  CommandValidationError,
} from "@/application/commands";
import {
  QueryAuthorizationError,
  QueryNotFoundError,
} from "@/application/queries";
import { EventStoreConcurrencyError } from "@/infrastructure/event-store";
import { AppError } from "@/lib/errors";

export function toErrorResponse(error: unknown, c: Context) {
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: `HTTP_${error.status}`,
          message: error.message,
        },
      },
      error.status,
    );
  }

  if (
    error instanceof CommandValidationError ||
    error instanceof QueryNotFoundError ||
    error instanceof CommandNotFoundError
  ) {
    return c.json(toBody(error), error instanceof CommandValidationError ? 400 : 404);
  }

  if (
    error instanceof CommandAuthorizationError ||
    error instanceof QueryAuthorizationError
  ) {
    return c.json(toBody(error), 403);
  }

  if (error instanceof EventStoreConcurrencyError) {
    return c.json(
      {
        ...toBody(error),
        expectedVersion: error.expectedVersion,
        actualVersion: error.actualVersion,
      },
      409,
    );
  }

  if (error instanceof AppError) {
    return c.json(toBody(error), 400);
  }

  console.error(error);

  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error.",
      },
    },
    500,
  );
}

function toBody(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
    },
  };
}
