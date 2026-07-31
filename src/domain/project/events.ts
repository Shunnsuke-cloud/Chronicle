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

export type ProjectEvent = {
  id: string;
  projectId: string;
  aggregateId: string;
  aggregateType: "project" | "decision" | "relation";
  type: ProjectEventType;
  version: number;
  actorId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
};
