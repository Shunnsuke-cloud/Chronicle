import { describe, expect, it } from "vitest";
import type { Event as EventRecord } from "@prisma/client";
import { EventStoreMappingError } from "@/infrastructure/event-store";
import { toProjectEvent } from "@/infrastructure/event-store/project-event-mapper";

describe("toProjectEvent", () => {
  it("maps an event record into a typed domain event", () => {
    const event = toProjectEvent({
      id: "event-1",
      projectId: "project-1",
      aggregateId: "decision-1",
      aggregateType: "decision",
      type: "DecisionStatusChanged",
      version: 3,
      actorId: "user-1",
      occurredAt: new Date("2026-08-01T00:00:00.000Z"),
      payload: {
        decisionId: "decision-1",
        status: "accepted",
      },
    } satisfies EventRecord);

    expect(event.type).toBe("DecisionStatusChanged");

    if (event.type === "DecisionStatusChanged") {
      expect(event.payload.status).toBe("accepted");
    }
  });

  it("rejects unsupported event types", () => {
    expect(() =>
      toProjectEvent({
        id: "event-1",
        projectId: "project-1",
        aggregateId: "decision-1",
        aggregateType: "decision",
        type: "UnknownEvent",
        version: 1,
        actorId: "user-1",
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        payload: {},
      } satisfies EventRecord),
    ).toThrow(EventStoreMappingError);
  });
});
