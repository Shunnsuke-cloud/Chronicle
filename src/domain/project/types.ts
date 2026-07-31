export type ProjectId = string;
export type DecisionId = string;
export type AlternativeId = string;
export type RelationId = string;

export type DecisionStatus =
  | "draft"
  | "proposed"
  | "accepted"
  | "rejected"
  | "deprecated"
  | "superseded";

export type RelationType =
  | "depends_on"
  | "blocks"
  | "supersedes"
  | "relates_to"
  | "conflicts_with";

export type ProjectState = {
  id: ProjectId;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  decisions: Record<DecisionId, DecisionState>;
  relations: Record<RelationId, DecisionRelationState>;
};

export type DecisionState = {
  id: DecisionId;
  projectId: ProjectId;
  title: string;
  description: string | null;
  status: DecisionStatus;
  alternatives: Record<AlternativeId, AlternativeState>;
  selectedAlternativeId: AlternativeId | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AlternativeState = {
  id: AlternativeId;
  decisionId: DecisionId;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DecisionRelationState = {
  id: RelationId;
  projectId: ProjectId;
  fromDecisionId: DecisionId;
  toDecisionId: DecisionId;
  type: RelationType;
  createdAt: Date;
};
