import { afterEach, describe, expect, it, vi } from "vitest";
import { authUnavailableResponse, isDatabaseUnavailable, logServerError } from "@/server/http/server-error";

afterEach(() => vi.restoreAllMocks());
describe("safe server errors", () => {
  it("recognizes Prisma adapter and network causes", () => {
    expect(isDatabaseUnavailable({ cause: { kind: "DatabaseNotReachable", host: "private" } })).toBe(true);
    expect(isDatabaseUnavailable({ code: "P1001" })).toBe(true);
    expect(isDatabaseUnavailable({ code: "P2002" })).toBe(false);
  });
  it("logs only safe fields", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logServerError("auth_sign_in", { code: "P1001", message: "postgresql://secret", query: "SELECT private" });
    expect(spy).toHaveBeenCalledWith(JSON.stringify({ event: "server_error", operation: "auth_sign_in", category: "database_unavailable", code: "P1001" }));
  });
  it("returns a retryable authentication error without internal details", async () => {
    const response = authUnavailableResponse();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ code: "AUTH_SERVICE_UNAVAILABLE" });
  });
});
