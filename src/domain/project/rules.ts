import type { DecisionStatus, RelationType } from "@/domain/project/types";

export const decisionStatuses = [
  "draft",
  "proposed",
  "accepted",
  "rejected",
  "deprecated",
  "superseded",
] as const satisfies readonly DecisionStatus[];

export const relationTypes = [
  "depends_on",
  "blocks",
  "supersedes",
  "relates_to",
  "conflicts_with",
] as const satisfies readonly RelationType[];

export function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeRequiredText(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}
