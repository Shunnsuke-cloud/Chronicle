import { describe, expect, it } from "vitest";
import { diffProjectStates } from "@/domain/project/diff";
import { reduceProjectEvents } from "@/domain/project/reducer";
import type { ProjectEvent } from "@/domain/project/events";

describe("diffProjectStates", () => {
  it("detects added and changed decisions between versions", () => {
    const events: ProjectEvent[] = [
      projectCreated(1),
      decisionCreated(2, "decision-1", "Use PostgreSQL"),
      titleChanged(3, "decision-1", "Use Neon PostgreSQL"),
      decisionCreated(4, "decision-2", "Use React Flow"),
    ];

    const from = reduceProjectEvents(events.slice(0, 2));
    const to = reduceProjectEvents(events);
    const diff = diffProjectStates(from, to);

    expect(diff.fromVersion).toBe(2);
    expect(diff.toVersion).toBe(4);
    expect(diff.addedDecisionIds).toEqual(["decision-2"]);
    expect(diff.changedDecisionIds).toEqual(["decision-1"]);
    expect(diff.removedDecisionIds).toEqual([]);
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
      description: null,
    },
  };
}

function decisionCreated(version: number, decisionId: string, title: string): ProjectEvent {
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

function titleChanged(version: number, decisionId: string, title: string): ProjectEvent {
  return {
    id: `event-${version}`,
    projectId: "project-1",
    aggregateId: decisionId,
    aggregateType: "decision",
    type: "DecisionTitleChanged",
    version,
    actorId: "user-1",
    occurredAt: dateFor(version),
    payload: {
      decisionId,
      title,
    },
  };
}

function dateFor(version: number) {
  return new Date(Date.UTC(2026, 7, 1, 0, 0, version));
}
