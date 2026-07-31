import { Hono } from "hono";

export const httpApp = new Hono().basePath("/api");

httpApp.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "chronicle",
  });
});
