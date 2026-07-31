import { Hono } from "hono";
import { createProjectRoutes } from "@/server/http/routes/projects";
import { toErrorResponse } from "@/server/http/errors";
import {
  projectCommandService,
  projectQueryService,
} from "@/server/services/project-services";

export const httpApp = new Hono().basePath("/api");

httpApp.use("*", async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
  c.header("Referrer-Policy", "same-origin");
  c.header("X-Content-Type-Options", "nosniff");
});

httpApp.onError((error, c) => toErrorResponse(error, c));

httpApp.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "chronicle",
  });
});

httpApp.route(
  "/",
  createProjectRoutes({
    commands: projectCommandService,
    queries: projectQueryService,
  }),
);
