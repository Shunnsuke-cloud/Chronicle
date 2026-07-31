import { describe, expect, it } from "vitest";
import type { ProjectEvent } from "@/domain/project/events";
import { ProjectReducerError } from "@/domain/project/errors";
import { reduceProjectEvents } from "@/domain/project/reducer";

const baseDate = new Date("2026-08-01T00:00:00.000Z");

describe("reduceProjectEvents", () => {
  it("reconstructs the current project state from ordered events", () => {
    const state = reduceProjectEvents([
      projectCreated(1),
      decisionCreated(2),
      alternativeAdded(3, "alternative-a", "PostgreSQL"),
      alternativeAdded(4, "alternative-b", "SQLite"),
      alternativeSelected(5, "alternative-a"),
      reasonChanged(6, "Managed PostgreSQL fits Vercel and branching workflows."),
      statusChanged(7, "accepted"),
      decisionCreated(8, "decision-2", "Use React Flow"),
      relationCreated(9, "relation-1", "decision-1", "decision-2"),
    ]);

    expect(state?.version).toBe(9);
    expect(state?.decisions["decision-1"]?.selectedAlternativeId).toBe("alternative-a");
    expect(state?.decisions["decision-1"]?.reason).toBe(
      "Managed PostgreSQL fits Vercel and branching workflows.",
    );
    expect(state?.decisions["decision-1"]?.status).toBe("accepted");
    expect(state?.relations["relation-1"]?.type).toBe("depends_on");
  });

  it("returns null when no events exist", () => {
    expect(reduceProjectEvents([])).toBeNull();
  });

  it("rejects event streams with missing versions", () => {
    expect(() => reduceProjectEvents([projectCreated(1), decisionCreated(3)])).toThrow(
      ProjectReducerError,
    );
  });

  it("rejects changes before ProjectCreated", () => {
    expect(() => reduceProjectEvents([decisionCreated(1)])).toThrow(ProjectReducerError);
  });

  it("rejects selecting an unknown alternative", () => {
    expect(() =>
      reduceProjectEvents([
        projectCreated(1),
        decisionCreated(2),
        alternativeSelected(3, "missing-alternative"),
      ]),
    ).toThrow(ProjectReducerError);
  });

  it("rejects relations to missing decisions", () => {
    expect(() =>
      reduceProjectEvents([
        projectCreated(1),
        decisionCreated(2),
        relationCreated(3, "relation-1", "decision-1", "missing-decision"),
      ]),
    ).toThrow(ProjectReducerError);
  });
});

function projectCreated(version: number): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: "project-1",
    aggregateType: "project",
    type: "ProjectCreated",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      projectId: "project-1",
      ownerId: "user-1",
      name: "Chronicle",
      description: "Decision history for software teams.",
    },
  };
}

function decisionCreated(
  version: number,
  decisionId = "decision-1",
  title = "Use Neon PostgreSQL",
): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: decisionId,
    aggregateType: "decision",
    type: "DecisionCreated",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      decisionId,
      title,
      description: null,
    },
  };
}

function alternativeAdded(
  version: number,
  alternativeId: string,
  title: string,
): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: "decision-1",
    aggregateType: "decision",
    type: "AlternativeAdded",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      decisionId: "decision-1",
      alternativeId,
      title,
      description: null,
    },
  };
}

function alternativeSelected(version: number, alternativeId: string): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: "decision-1",
    aggregateType: "decision",
    type: "AlternativeSelected",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      decisionId: "decision-1",
      alternativeId,
    },
  };
}

function reasonChanged(version: number, reason: string): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: "decision-1",
    aggregateType: "decision",
    type: "ReasonChanged",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      decisionId: "decision-1",
      reason,
    },
  };
}

function statusChanged(version: number, status: "accepted"): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: "decision-1",
    aggregateType: "decision",
    type: "DecisionStatusChanged",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      decisionId: "decision-1",
      status,
    },
  };
}

function relationCreated(
  version: number,
  relationId: string,
  fromDecisionId: string,
  toDecisionId: string,
): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: relationId,
    aggregateType: "relation",
    type: "RelationCreated",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      relationId,
      fromDecisionId,
      toDecisionId,
      type: "depends_on",
    },
  };
}

function dateFor(version: number) {
  return new Date(baseDate.getTime() + version * 1000);
}
