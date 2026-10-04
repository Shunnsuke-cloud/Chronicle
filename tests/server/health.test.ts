import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/server/db/prisma", () => ({ prisma: { $queryRaw: query } }));
vi.mock("@/server/services/project-services", () => ({ projectCommandService: {}, projectQueryService: {} }));
vi.mock("@/server/http/routes/projects", () => ({ createProjectRoutes: () => new Hono() }));
import { httpApp } from "@/server/http/app";

afterEach(() => { vi.restoreAllMocks(); query.mockReset(); });
describe("database readiness", () => {
  it("executes a DB query before reporting ready", async () => {
    query.mockResolvedValue([{ "?column?": 1 }]);
    const response = await httpApp.request("http://localhost/api/health");
    expect(response.status).toBe(200);
    expect(query).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({ database: "reachable" });
  });
  it("returns 503 without exposing DB details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    query.mockRejectedValue(new Error("private-connection-string"));
    const response = await httpApp.request("http://localhost/api/health");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: false, service: "chronicle", database: "unavailable" });
  });
});
