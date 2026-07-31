import type { Event as EventRecord, Prisma } from "@prisma/client";
import type {
  AggregateType,
  ProjectEvent,
  ProjectEventType,
} from "@/domain/project/events";
import type {
  DecisionStatus,
  RelationType,
} from "@/domain/project/types";
import { EventStoreMappingError } from "@/infrastructure/event-store/errors";

export function toProjectEvent(record: EventRecord): ProjectEvent {
  const type = readEventType(record.type);
  const aggregateType = readAggregateType(record.aggregateType);
  const payload = readPayload(record.payload);
  const base = {
    id: record.id,
    projectId: record.projectId,
    aggregateId: record.aggregateId,
    aggregateType,
    type,
    version: record.version,
    actorId: record.actorId,
    occurredAt: record.occurredAt,
  };

  switch (type) {
    case "ProjectCreated":
      return {
        ...base,
        aggregateType: "project",
        type,
        payload: {
          projectId: readString(payload, "projectId"),
          ownerId: readString(payload, "ownerId"),
          name: readString(payload, "name"),
          description: readNullableString(payload, "description"),
        },
      };

    case "DecisionCreated":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          title: readString(payload, "title"),
          description: readNullableString(payload, "description"),
        },
      };

    case "DecisionTitleChanged":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          title: readString(payload, "title"),
        },
      };

    case "DecisionDescriptionChanged":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          description: readNullableString(payload, "description"),
        },
      };

    case "AlternativeAdded":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          alternativeId: readString(payload, "alternativeId"),
          title: readString(payload, "title"),
          description: readNullableString(payload, "description"),
        },
      };

    case "AlternativeUpdated":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          alternativeId: readString(payload, "alternativeId"),
          title: readString(payload, "title"),
          description: readNullableString(payload, "description"),
        },
      };

    case "AlternativeSelected":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          alternativeId: readString(payload, "alternativeId"),
        },
      };

    case "ReasonChanged":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          reason: readNullableString(payload, "reason"),
        },
      };

    case "DecisionStatusChanged":
      return {
        ...base,
        aggregateType: "decision",
        type,
        payload: {
          decisionId: readString(payload, "decisionId"),
          status: readDecisionStatus(payload, "status"),
        },
      };

    case "RelationCreated":
      return {
        ...base,
        aggregateType: "relation",
        type,
        payload: {
          relationId: readString(payload, "relationId"),
          fromDecisionId: readString(payload, "fromDecisionId"),
          toDecisionId: readString(payload, "toDecisionId"),
          type: readRelationType(payload, "type"),
        },
      };

    case "RelationRemoved":
      return {
        ...base,
        aggregateType: "relation",
        type,
        payload: {
          relationId: readString(payload, "relationId"),
        },
      };
  }
}

export function toPrismaJson(payload: Record<string, unknown>): Prisma.InputJsonObject {
  return payload as Prisma.InputJsonObject;
}

function readPayload(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new EventStoreMappingError("Event payload must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function readString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  if (typeof value !== "string") {
    throw new EventStoreMappingError(`Event payload field ${key} must be a string.`);
  }

  return value;
}

function readNullableString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new EventStoreMappingError(
      `Event payload field ${key} must be a string or null.`,
    );
  }

  return value;
}

function readEventType(type: string): ProjectEventType {
  if (
    type === "ProjectCreated" ||
    type === "DecisionCreated" ||
    type === "DecisionTitleChanged" ||
    type === "DecisionDescriptionChanged" ||
    type === "AlternativeAdded" ||
    type === "AlternativeUpdated" ||
    type === "AlternativeSelected" ||
    type === "ReasonChanged" ||
    type === "DecisionStatusChanged" ||
    type === "RelationCreated" ||
    type === "RelationRemoved"
  ) {
    return type;
  }

  throw new EventStoreMappingError(`Unsupported event type ${type}.`);
}

function readAggregateType(type: string): AggregateType {
  if (type === "project" || type === "decision" || type === "relation") {
    return type;
  }

  throw new EventStoreMappingError(`Unsupported aggregate type ${type}.`);
}

function readDecisionStatus(
  payload: Record<string, unknown>,
  key: string,
): DecisionStatus {
  const value = readString(payload, key);

  if (
    value === "draft" ||
    value === "proposed" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "deprecated" ||
    value === "superseded"
  ) {
    return value;
  }

  throw new EventStoreMappingError(`Unsupported decision status ${value}.`);
}

function readRelationType(payload: Record<string, unknown>, key: string): RelationType {
  const value = readString(payload, key);

  if (
    value === "depends_on" ||
    value === "blocks" ||
    value === "supersedes" ||
    value === "relates_to" ||
    value === "conflicts_with"
  ) {
    return value;
  }

  throw new EventStoreMappingError(`Unsupported relation type ${value}.`);
}
