import type {
  DecisionId,
  ProjectState,
  RelationId,
} from "@/domain/project/types";

export type ProjectDiff = {
  fromVersion: number | null;
  toVersion: number | null;
  projectChanged: boolean;
  addedDecisionIds: DecisionId[];
  removedDecisionIds: DecisionId[];
  changedDecisionIds: DecisionId[];
  addedRelationIds: RelationId[];
  removedRelationIds: RelationId[];
  changedRelationIds: RelationId[];
};

export function diffProjectStates(
  from: ProjectState | null,
  to: ProjectState | null,
): ProjectDiff {
  return {
    fromVersion: from?.version ?? null,
    toVersion: to?.version ?? null,
    projectChanged:
      from?.name !== to?.name ||
      from?.description !== to?.description ||
      from?.ownerId !== to?.ownerId,
    addedDecisionIds: addedKeys(from?.decisions, to?.decisions),
    removedDecisionIds: removedKeys(from?.decisions, to?.decisions),
    changedDecisionIds: changedKeys(from?.decisions, to?.decisions),
    addedRelationIds: addedKeys(from?.relations, to?.relations),
    removedRelationIds: removedKeys(from?.relations, to?.relations),
    changedRelationIds: changedKeys(from?.relations, to?.relations),
  };
}

function addedKeys<T>(from: Record<string, T> | undefined, to: Record<string, T> | undefined) {
  return Object.keys(to ?? {}).filter((key) => !(key in (from ?? {})));
}

function removedKeys<T>(from: Record<string, T> | undefined, to: Record<string, T> | undefined) {
  return Object.keys(from ?? {}).filter((key) => !(key in (to ?? {})));
}

function changedKeys<T>(from: Record<string, T> | undefined, to: Record<string, T> | undefined) {
  return Object.keys(to ?? {}).filter((key) => {
    if (!(key in (from ?? {}))) {
      return false;
    }

    return JSON.stringify(from?.[key]) !== JSON.stringify(to?.[key]);
  });
}
