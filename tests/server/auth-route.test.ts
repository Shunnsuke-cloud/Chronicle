import { afterEach, describe, expect, it, vi } from "vitest";

const { handler } = vi.hoisted(() => ({ handler: vi.fn() }));
vi.mock("@/server/auth/auth", () => ({ auth: {} }));
vi.mock("better-auth/next-js", () => ({ toNextJsHandler: () => ({ GET: handler, POST: handler, PUT: handler, PATCH: handler, DELETE: handler }) }));
import { POST } from "@/app/api/auth/[...all]/route";

afterEach(() => { vi.restoreAllMocks(); handler.mockReset(); });
describe("authentication route", () => {
  it.each(["sign-in", "sign-up"])("protects %s from thrown DB errors", async (operation) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    handler.mockRejectedValue({ cause: { kind: "DatabaseNotReachable", host: "private-host" } });
    const response = await POST(new Request(`https://example.com/api/auth/${operation}/email`, { method: "POST" }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private-host");
  });
  it("sanitizes errors already handled by Better Auth", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [status, code] of [[500, "INTERNAL_SERVER_ERROR"], [422, "FAILED_TO_CREATE_USER"]] as const) {
      handler.mockResolvedValue(Response.json({ code, message: "private-host" }, { status }));
      expect((await POST(new Request("https://example.com/api/auth/sign-up/email"))).status).toBe(503);
    }
  });
  it("preserves credential failures and successful cookies", async () => {
    for (const response of [Response.json({ code: "INVALID_EMAIL_OR_PASSWORD" }, { status: 401 }), new Response(null, { headers: { "Set-Cookie": "session=test; HttpOnly" } })]) {
      handler.mockResolvedValue(response);
      expect(await POST(new Request("https://example.com/api/auth/sign-in/email"))).toBe(response);
    }
  });
});
