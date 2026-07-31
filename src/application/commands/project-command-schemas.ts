import { z } from "zod";
import { decisionStatuses, relationTypes } from "@/domain/project/rules";

const idSchema = z.string().trim().min(1).max(128);
const requiredTextSchema = z.string().trim().min(1).max(200);
const longTextSchema = z.string().trim().max(5000).nullable().optional();
const expectedVersionSchema = z.number().int().min(0);

const commandBaseSchema = z.object({
  actorId: idSchema,
  projectId: idSchema,
  expectedVersion: expectedVersionSchema,
});

export const createProjectCommandSchema = z.object({
  actorId: idSchema,
  name: requiredTextSchema,
  description: longTextSchema,
});

export const createDecisionCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema.optional(),
  title: requiredTextSchema,
  description: longTextSchema,
});

export const changeDecisionTitleCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  title: requiredTextSchema,
});

export const changeDecisionDescriptionCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  description: longTextSchema,
});

export const addAlternativeCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  alternativeId: idSchema.optional(),
  title: requiredTextSchema,
  description: longTextSchema,
});

export const updateAlternativeCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  alternativeId: idSchema,
  title: requiredTextSchema,
  description: longTextSchema,
});

export const selectAlternativeCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  alternativeId: idSchema,
});

export const changeReasonCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  reason: longTextSchema,
});

export const changeDecisionStatusCommandSchema = commandBaseSchema.extend({
  decisionId: idSchema,
  status: z.enum(decisionStatuses),
});

export const createRelationCommandSchema = commandBaseSchema.extend({
  relationId: idSchema.optional(),
  fromDecisionId: idSchema,
  toDecisionId: idSchema,
  type: z.enum(relationTypes),
});

export const removeRelationCommandSchema = commandBaseSchema.extend({
  relationId: idSchema,
});

export type CreateProjectCommand = z.infer<typeof createProjectCommandSchema>;
export type CreateDecisionCommand = z.infer<typeof createDecisionCommandSchema>;
export type ChangeDecisionTitleCommand = z.infer<
  typeof changeDecisionTitleCommandSchema
>;
export type ChangeDecisionDescriptionCommand = z.infer<
  typeof changeDecisionDescriptionCommandSchema
>;
export type AddAlternativeCommand = z.infer<typeof addAlternativeCommandSchema>;
export type UpdateAlternativeCommand = z.infer<
  typeof updateAlternativeCommandSchema
>;
export type SelectAlternativeCommand = z.infer<
  typeof selectAlternativeCommandSchema
>;
export type ChangeReasonCommand = z.infer<typeof changeReasonCommandSchema>;
export type ChangeDecisionStatusCommand = z.infer<
  typeof changeDecisionStatusCommandSchema
>;
export type CreateRelationCommand = z.infer<typeof createRelationCommandSchema>;
export type RemoveRelationCommand = z.infer<typeof removeRelationCommandSchema>;
