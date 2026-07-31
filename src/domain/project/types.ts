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
