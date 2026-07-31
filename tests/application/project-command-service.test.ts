import { describe, expect, it } from "vitest";
import {
  CommandAuthorizationError,
  CommandNotFoundError,
  CommandValidationError,
  ProjectCommandService,
} from "@/application/commands";
import { EventStoreConcurrencyError, InMemoryProjectEventStore } from "@/infrastructure/event-store";

describe("ProjectCommandService", () => {
  it("creates a project and records ProjectCreated", async () => {
    const service = new ProjectCommandService(new InMemoryProjectEventStore());

    const result = await service.createProject({
      actorId: "user-1",
      name: " Chronicle ",
      description: " Decision history ",
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe("ProjectCreated");
    expect(result.state.ownerId).toBe("user-1");
    expect(result.state.name).toBe("Chronicle");
    expect(result.state.description).toBe("Decision history");
    expect(result.state.version).toBe(1);
  });

  it("creates and updates a decision through append-only events", async () => {
    const store = new InMemoryProjectEventStore();
    const service = new ProjectCommandService(store);
    const project = await service.createProject({
      actorId: "user-1",
      name: "Chronicle",
      description: null,
    });

    const decision = await service.createDecision({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: project.state.version,
      decisionId: "decision-1",
      title: "Use PostgreSQL",
      description: null,
    });

    const alternative = await service.addAlternative({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: decision.state.version,
      decisionId: "decision-1",
      alternativeId: "alternative-1",
      title: "Neon",
      description: "Serverless Postgres",
    });

    const selected = await service.selectAlternative({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: alternative.state.version,
      decisionId: "decision-1",
      alternativeId: "alternative-1",
    });

    const reason = await service.changeReason({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: selected.state.version,
      decisionId: "decision-1",
      reason: "It fits the Vercel deployment model.",
    });

    expect(reason.state.version).toBe(5);
    expect(reason.state.decisions["decision-1"]?.selectedAlternativeId).toBe(
      "alternative-1",
    );
    expect(reason.state.decisions["decision-1"]?.reason).toBe(
      "It fits the Vercel deployment model.",
    );
    await expect(store.getCurrentVersion(project.state.id)).resolves.toBe(5);
  });

  it("creates and removes relations", async () => {
    const service = new ProjectCommandService(new InMemoryProjectEventStore());
    const project = await service.createProject({
      actorId: "user-1",
      name: "Chronicle",
      description: null,
    });
    const first = await service.createDecision({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: 1,
      decisionId: "decision-1",
      title: "Use PostgreSQL",
      description: null,
    });
    const second = await service.createDecision({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: first.state.version,
      decisionId: "decision-2",
      title: "Use React Flow",
      description: null,
    });

    const related = await service.createRelation({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: second.state.version,
      relationId: "relation-1",
      fromDecisionId: "decision-1",
      toDecisionId: "decision-2",
      type: "depends_on",
    });

    expect(Object.keys(related.state.relations)).toEqual(["relation-1"]);

    const removed = await service.removeRelation({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: related.state.version,
      relationId: "relation-1",
    });

    expect(Object.keys(removed.state.relations)).toEqual([]);
  });

  it("rejects commands from non-owners", async () => {
    const service = new ProjectCommandService(new InMemoryProjectEventStore());
    const project = await service.createProject({
      actorId: "owner-1",
      name: "Chronicle",
      description: null,
    });

    await expect(
      service.createDecision({
        actorId: "user-2",
        projectId: project.state.id,
        expectedVersion: 1,
        decisionId: "decision-1",
        title: "Use PostgreSQL",
        description: null,
      }),
    ).rejects.toBeInstanceOf(CommandAuthorizationError);
  });

  it("rejects stale expectedVersion values", async () => {
    const service = new ProjectCommandService(new InMemoryProjectEventStore());
    const project = await service.createProject({
      actorId: "user-1",
      name: "Chronicle",
      description: null,
    });

    await service.createDecision({
      actorId: "user-1",
      projectId: project.state.id,
      expectedVersion: 1,
      decisionId: "decision-1",
      title: "Use PostgreSQL",
      description: null,
    });

    await expect(
      service.createDecision({
        actorId: "user-1",
        projectId: project.state.id,
        expectedVersion: 1,
        decisionId: "decision-2",
        title: "Use React Flow",
        description: null,
      }),
    ).rejects.toBeInstanceOf(EventStoreConcurrencyError);
  });

  it("rejects invalid input and missing decisions", async () => {
    const service = new ProjectCommandService(new InMemoryProjectEventStore());
    const project = await service.createProject({
      actorId: "user-1",
      name: "Chronicle",
      description: null,
    });

    await expect(
      service.createDecision({
        actorId: "user-1",
        projectId: project.state.id,
        expectedVersion: 1,
        title: "",
        description: null,
      }),
    ).rejects.toBeInstanceOf(CommandValidationError);

    await expect(
      service.changeDecisionTitle({
        actorId: "user-1",
        projectId: project.state.id,
        expectedVersion: 1,
        decisionId: "missing",
        title: "Use PostgreSQL",
      }),
    ).rejects.toBeInstanceOf(CommandNotFoundError);
  });
});
