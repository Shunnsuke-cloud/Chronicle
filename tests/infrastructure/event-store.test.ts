import { describe, expect, it } from "vitest";
import type { ProjectEventDraft } from "@/infrastructure/event-store";
import {
  EventStoreConcurrencyError,
  InMemoryProjectEventStore,
} from "@/infrastructure/event-store";

describe("InMemoryProjectEventStore", () => {
  it("assigns ordered versions when appending events", async () => {
    const store = new InMemoryProjectEventStore();
    const saved = await store.append({
      projectId: "project-1",
      expectedVersion: 0,
      events: [
        projectCreatedDraft(),
        decisionCreatedDraft("decision-1", "Use PostgreSQL"),
      ],
    });

    expect(saved.map((event) => event.version)).toEqual([1, 2]);
    await expect(store.getCurrentVersion("project-1")).resolves.toBe(2);
  });

  it("rejects appends with stale expectedVersion", async () => {
    const store = new InMemoryProjectEventStore();

    await store.append({
      projectId: "project-1",
      expectedVersion: 0,
      events: [projectCreatedDraft()],
    });

    await expect(
      store.append({
        projectId: "project-1",
        expectedVersion: 0,
        events: [decisionCreatedDraft("decision-1", "Use PostgreSQL")],
      }),
    ).rejects.toBeInstanceOf(EventStoreConcurrencyError);
  });

  it("filters events by target version", async () => {
    const store = new InMemoryProjectEventStore();

    await store.append({
      projectId: "project-1",
      expectedVersion: 0,
      events: [
        projectCreatedDraft(),
        decisionCreatedDraft("decision-1", "Use PostgreSQL"),
        decisionTitleChangedDraft("decision-1", "Use Neon PostgreSQL"),
      ],
    });

    const events = await store.getEvents("project-1", { toVersion: 2 });

    expect(events.map((event) => event.type)).toEqual([
      "ProjectCreated",
      "DecisionCreated",
    ]);
  });
});

function projectCreatedDraft(): ProjectEventDraft {
  return {
    projectId: "project-1",
    aggregateId: "project-1",
    aggregateType: "project",
    type: "ProjectCreated",
    actorId: "user-1",
    payload: {
      projectId: "project-1",
      ownerId: "user-1",
      name: "Chronicle",
      description: null,
    },
  };
}

function decisionCreatedDraft(decisionId: string, title: string): ProjectEventDraft {
  return {
    projectId: "project-1",
    aggregateId: decisionId,
    aggregateType: "decision",
    type: "DecisionCreated",
    actorId: "user-1",
    payload: {
      decisionId,
      title,
      description: null,
    },
  };
}

function decisionTitleChangedDraft(
  decisionId: string,
  title: string,
): ProjectEventDraft {
  return {
    projectId: "project-1",
    aggregateId: decisionId,
    aggregateType: "decision",
    type: "DecisionTitleChanged",
    actorId: "user-1",
    payload: {
      decisionId,
      title,
    },
  };
}
