import type {
  AlternativeId,
  DecisionId,
  DecisionStatus,
  ProjectId,
  RelationId,
  RelationType,
} from "@/domain/project/types";

export type ProjectEventType =
  | "ProjectCreated"
  | "DecisionCreated"
  | "DecisionTitleChanged"
  | "DecisionDescriptionChanged"
  | "AlternativeAdded"
  | "AlternativeUpdated"
  | "AlternativeSelected"
  | "ReasonChanged"
  | "DecisionStatusChanged"
  | "RelationCreated"
  | "RelationRemoved";

export type AggregateType = "project" | "decision" | "relation";

type EventBase<
  Type extends ProjectEventType,
  Aggregate extends AggregateType,
  Payload extends Record<string, unknown>,
> = {
  id: string;
  projectId: ProjectId;
  aggregateId: string;
  aggregateType: Aggregate;
  type: Type;
  version: number;
  actorId: string;
  occurredAt: Date;
  payload: Payload;
};

export type ProjectCreatedEvent = EventBase<
  "ProjectCreated",
  "project",
  {
    projectId: ProjectId;
    ownerId: string;
    name: string;
    description: string | null;
  }
>;

export type DecisionCreatedEvent = EventBase<
  "DecisionCreated",
  "decision",
  {
    decisionId: DecisionId;
    title: string;
    description: string | null;
  }
>;

export type DecisionTitleChangedEvent = EventBase<
  "DecisionTitleChanged",
  "decision",
  {
    decisionId: DecisionId;
    title: string;
  }
>;

export type DecisionDescriptionChangedEvent = EventBase<
  "DecisionDescriptionChanged",
  "decision",
  {
    decisionId: DecisionId;
    description: string | null;
  }
>;

export type AlternativeAddedEvent = EventBase<
  "AlternativeAdded",
  "decision",
  {
    decisionId: DecisionId;
    alternativeId: AlternativeId;
    title: string;
    description: string | null;
  }
>;

export type AlternativeUpdatedEvent = EventBase<
  "AlternativeUpdated",
  "decision",
  {
    decisionId: DecisionId;
    alternativeId: AlternativeId;
    title: string;
    description: string | null;
  }
>;

export type AlternativeSelectedEvent = EventBase<
  "AlternativeSelected",
  "decision",
  {
    decisionId: DecisionId;
    alternativeId: AlternativeId;
  }
>;

export type ReasonChangedEvent = EventBase<
  "ReasonChanged",
  "decision",
  {
    decisionId: DecisionId;
    reason: string | null;
  }
>;

export type DecisionStatusChangedEvent = EventBase<
  "DecisionStatusChanged",
  "decision",
  {
    decisionId: DecisionId;
    status: DecisionStatus;
  }
>;

export type RelationCreatedEvent = EventBase<
  "RelationCreated",
  "relation",
  {
    relationId: RelationId;
    fromDecisionId: DecisionId;
    toDecisionId: DecisionId;
    type: RelationType;
  }
>;

export type RelationRemovedEvent = EventBase<
  "RelationRemoved",
  "relation",
  {
    relationId: RelationId;
  }
>;

export type ProjectEvent =
  | ProjectCreatedEvent
  | DecisionCreatedEvent
  | DecisionTitleChangedEvent
  | DecisionDescriptionChangedEvent
  | AlternativeAddedEvent
  | AlternativeUpdatedEvent
  | AlternativeSelectedEvent
  | ReasonChangedEvent
  | DecisionStatusChangedEvent
  | RelationCreatedEvent
  | RelationRemovedEvent;
