import { Hono } from "hono";
import type {
  AddAlternativeCommand,
  ChangeDecisionDescriptionCommand,
  ChangeDecisionStatusCommand,
  ChangeDecisionTitleCommand,
  ChangeReasonCommand,
  CreateDecisionCommand,
  CreateProjectCommand,
  CreateRelationCommand,
  ProjectCommandService,
  RemoveRelationCommand,
  SelectAlternativeCommand,
  UpdateAlternativeCommand,
} from "@/application/commands";
import type { ProjectQueryService } from "@/application/queries";
import { requireHttpUser } from "@/server/http/auth";
import {
  readJsonObject,
  readOptionalDate,
  readOptionalInteger,
  readRequiredInteger,
  readRequiredParam,
} from "@/server/http/request";

type ProjectRoutesDependencies = {
  commands: ProjectCommandService;
  queries: ProjectQueryService;
};

export function createProjectRoutes({
  commands,
  queries,
}: ProjectRoutesDependencies) {
  const app = new Hono();

  app.get("/projects", async (c) => {
    const user = await requireHttpUser(c);
    const projects = await queries.listProjects(user.id);

    return c.json({ projects });
  });

  app.post("/projects", async (c) => {
    const user = await requireHttpUser(c);
    const body = await readJsonObject(c.req);
    const result = await commands.createProject(
      commandInput<CreateProjectCommand>(body, user.id),
    );

    return c.json(result, 201);
  });

  app.get("/projects/:projectId", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const version = readOptionalInteger(c.req.query("version"), "version");
    const state =
      version === undefined
        ? await queries.getProjectState(projectId, user.id)
        : await queries.getProjectStateAtVersion(projectId, user.id, version);

    return c.json({ state });
  });

  app.get("/projects/:projectId/state", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const version = readOptionalInteger(c.req.query("version"), "version");
    const occurredAtValue = c.req.query("occurredAt");

    if (version !== undefined && occurredAtValue) {
      return c.json(
        {
          error: {
            code: "INVALID_QUERY",
            message: "Use either version or occurredAt, not both.",
          },
        },
        400,
      );
    }

    const occurredAt = readOptionalDate(occurredAtValue, "occurredAt");
    const state =
      version !== undefined
        ? await queries.getProjectStateAtVersion(projectId, user.id, version)
        : occurredAt
          ? await queries.getProjectStateAtTime(projectId, user.id, occurredAt)
          : await queries.getProjectState(projectId, user.id);

    return c.json({ state });
  });

  app.get("/projects/:projectId/events", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const events = await queries.getProjectEvents(projectId, user.id);

    return c.json({ events });
  });

  app.get("/projects/:projectId/graph", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const graph = await queries.getProjectGraph(projectId, user.id);

    return c.json(graph);
  });

  app.get("/projects/:projectId/compare", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const fromVersion = readRequiredInteger(c.req.query("fromVersion"), "fromVersion");
    const toVersion = readOptionalInteger(c.req.query("toVersion"), "toVersion");
    const comparison = await queries.compareProjectVersions(
      projectId,
      user.id,
      fromVersion,
      toVersion,
    );

    return c.json(comparison);
  });

  app.post("/projects/:projectId/commands/create-decision", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.createDecision(
      commandInput<CreateDecisionCommand>(body, user.id, projectId),
    );

    return c.json(result, 201);
  });

  app.post("/projects/:projectId/commands/change-decision-title", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.changeDecisionTitle(
      commandInput<ChangeDecisionTitleCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  app.post("/projects/:projectId/commands/change-decision-description", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.changeDecisionDescription(
      commandInput<ChangeDecisionDescriptionCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  app.post("/projects/:projectId/commands/add-alternative", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.addAlternative(
      commandInput<AddAlternativeCommand>(body, user.id, projectId),
    );

    return c.json(result, 201);
  });

  app.post("/projects/:projectId/commands/update-alternative", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.updateAlternative(
      commandInput<UpdateAlternativeCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  app.post("/projects/:projectId/commands/select-alternative", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.selectAlternative(
      commandInput<SelectAlternativeCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  app.post("/projects/:projectId/commands/change-reason", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.changeReason(
      commandInput<ChangeReasonCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  app.post("/projects/:projectId/commands/change-decision-status", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.changeDecisionStatus(
      commandInput<ChangeDecisionStatusCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  app.post("/projects/:projectId/commands/create-relation", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.createRelation(
      commandInput<CreateRelationCommand>(body, user.id, projectId),
    );

    return c.json(result, 201);
  });

  app.post("/projects/:projectId/commands/remove-relation", async (c) => {
    const user = await requireHttpUser(c);
    const projectId = readRequiredParam(c.req.param("projectId"), "projectId");
    const body = await readJsonObject(c.req);
    const result = await commands.removeRelation(
      commandInput<RemoveRelationCommand>(body, user.id, projectId),
    );

    return c.json(result);
  });

  return app;
}

function commandInput<Command>(
  body: Record<string, unknown>,
  actorId: string,
  projectId?: string,
) {
  return {
    ...body,
    actorId,
    ...(projectId ? { projectId } : {}),
  } as Command;
}
