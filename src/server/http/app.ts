import { Hono } from "hono";
import { createProjectRoutes } from "@/server/http/routes/projects";
import { toErrorResponse } from "@/server/http/errors";
import { prisma } from "@/server/db/prisma";
import { logServerError } from "@/server/http/server-error";
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

httpApp.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ok: true, service: "chronicle", database: "reachable" });
  } catch (error) {
    logServerError("health_database", error);
    return c.json({ ok: false, service: "chronicle", database: "unavailable" }, 503);
  }
});

httpApp.route(
  "/",
  createProjectRoutes({
    commands: projectCommandService,
    queries: projectQueryService,
  }),
);
