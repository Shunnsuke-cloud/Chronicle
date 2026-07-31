import { Hono } from "hono";
import { createProjectRoutes } from "@/server/http/routes/projects";
import { toErrorResponse } from "@/server/http/errors";
import {
  projectCommandService,
  projectQueryService,
} from "@/server/services/project-services";

export const httpApp = new Hono().basePath("/api");

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
