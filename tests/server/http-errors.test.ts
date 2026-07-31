import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { CommandValidationError } from "@/application/commands";
import { EventStoreConcurrencyError } from "@/infrastructure/event-store";
import { toErrorResponse } from "@/server/http/errors";

describe("HTTP error responses", () => {
  it("returns JSON for HTTP boundary errors", async () => {
    const app = appWithErrorHandler();
    app.get("/unauthorized", () => {
      throw new HTTPException(401, { message: "Authentication required." });
    });

    const response = await app.request("http://localhost/unauthorized");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "HTTP_401",
        message: "Authentication required.",
      },
    });
  });

  it("returns validation errors as 400 JSON", async () => {
    const app = appWithErrorHandler();
    app.get("/invalid", () => {
      throw new CommandValidationError("title is required");
    });

    const response = await app.request("http://localhost/invalid");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "COMMAND_VALIDATION_ERROR",
        message: "title is required",
      },
    });
  });

  it("includes expected and actual versions for conflicts", async () => {
    const app = appWithErrorHandler();
    app.get("/conflict", () => {
      throw new EventStoreConcurrencyError("project-1", 3, 4);
    });

    const response = await app.request("http://localhost/conflict");

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "EVENT_STORE_CONCURRENCY_ERROR" },
      expectedVersion: 3,
      actualVersion: 4,
    });
  });
});

function appWithErrorHandler() {
  const app = new Hono();
  app.onError((error, c) => toErrorResponse(error, c));
  return app;
}
