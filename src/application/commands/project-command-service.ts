import { z } from "zod";
import type { ProjectEvent } from "@/domain/project/events";
import { reduceProjectEvents } from "@/domain/project/reducer";
import type { ProjectState } from "@/domain/project/types";
import type {
  ProjectEventDraft,
  ProjectEventStore,
} from "@/infrastructure/event-store";
import {
  CommandAuthorizationError,
  CommandNotFoundError,
  CommandValidationError,
} from "@/application/commands/errors";
import {
  addAlternativeCommandSchema,
  changeDecisionDescriptionCommandSchema,
  changeDecisionStatusCommandSchema,
  changeDecisionTitleCommandSchema,
  changeReasonCommandSchema,
  createDecisionCommandSchema,
  createProjectCommandSchema,
  createRelationCommandSchema,
  removeRelationCommandSchema,
  selectAlternativeCommandSchema,
  updateAlternativeCommandSchema,
  type AddAlternativeCommand,
  type ChangeDecisionDescriptionCommand,
  type ChangeDecisionStatusCommand,
  type ChangeDecisionTitleCommand,
  type ChangeReasonCommand,
  type CreateDecisionCommand,
  type CreateProjectCommand,
  type CreateRelationCommand,
  type RemoveRelationCommand,
  type SelectAlternativeCommand,
  type UpdateAlternativeCommand,
} from "@/application/commands/project-command-schemas";

export type CommandResult = {
  events: ProjectEvent[];
  state: ProjectState;
};

export class ProjectCommandService {
  constructor(private readonly eventStore: ProjectEventStore) {}

  async createProject(command: CreateProjectCommand): Promise<CommandResult> {
    const input = parseCommand(createProjectCommandSchema, command);
    const projectId = crypto.randomUUID();
    const event = {
      projectId,
      aggregateId: projectId,
      aggregateType: "project",
      type: "ProjectCreated",
      actorId: input.actorId,
      payload: {
        projectId,
        ownerId: input.actorId,
        name: input.name,
        description: input.description ?? null,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(projectId, 0, [event]);
  }

  async createDecision(command: CreateDecisionCommand): Promise<CommandResult> {
    const input = parseCommand(createDecisionCommandSchema, command);
    const state = await this.loadAuthorizedState(input.projectId, input.actorId);
    const decisionId = input.decisionId ?? crypto.randomUUID();

    if (state.decisions[decisionId]) {
      throw new CommandValidationError(`Decision ${decisionId} already exists.`);
    }

    const event = {
      projectId: input.projectId,
      aggregateId: decisionId,
      aggregateType: "decision",
      type: "DecisionCreated",
      actorId: input.actorId,
      payload: {
        decisionId,
        title: input.title,
        description: input.description ?? null,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async changeDecisionTitle(
    command: ChangeDecisionTitleCommand,
  ): Promise<CommandResult> {
    const input = parseCommand(changeDecisionTitleCommandSchema, command);
    await this.requireDecision(input.projectId, input.actorId, input.decisionId);

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "DecisionTitleChanged",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        title: input.title,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async changeDecisionDescription(
    command: ChangeDecisionDescriptionCommand,
  ): Promise<CommandResult> {
    const input = parseCommand(changeDecisionDescriptionCommandSchema, command);
    await this.requireDecision(input.projectId, input.actorId, input.decisionId);

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "DecisionDescriptionChanged",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        description: input.description ?? null,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async addAlternative(command: AddAlternativeCommand): Promise<CommandResult> {
    const input = parseCommand(addAlternativeCommandSchema, command);
    const state = await this.requireDecision(
      input.projectId,
      input.actorId,
      input.decisionId,
    );
    const alternativeId = input.alternativeId ?? crypto.randomUUID();
    const decision = state.decisions[input.decisionId];

    if (decision?.alternatives[alternativeId]) {
      throw new CommandValidationError(`Alternative ${alternativeId} already exists.`);
    }

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "AlternativeAdded",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        alternativeId,
        title: input.title,
        description: input.description ?? null,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async updateAlternative(command: UpdateAlternativeCommand): Promise<CommandResult> {
    const input = parseCommand(updateAlternativeCommandSchema, command);
    const state = await this.requireDecision(
      input.projectId,
      input.actorId,
      input.decisionId,
    );
    const decision = state.decisions[input.decisionId];

    if (!decision?.alternatives[input.alternativeId]) {
      throw new CommandNotFoundError(`Alternative ${input.alternativeId} not found.`);
    }

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "AlternativeUpdated",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        alternativeId: input.alternativeId,
        title: input.title,
        description: input.description ?? null,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async selectAlternative(command: SelectAlternativeCommand): Promise<CommandResult> {
    const input = parseCommand(selectAlternativeCommandSchema, command);
    const state = await this.requireDecision(
      input.projectId,
      input.actorId,
      input.decisionId,
    );
    const decision = state.decisions[input.decisionId];

    if (!decision?.alternatives[input.alternativeId]) {
      throw new CommandNotFoundError(`Alternative ${input.alternativeId} not found.`);
    }

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "AlternativeSelected",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        alternativeId: input.alternativeId,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async changeReason(command: ChangeReasonCommand): Promise<CommandResult> {
    const input = parseCommand(changeReasonCommandSchema, command);
    await this.requireDecision(input.projectId, input.actorId, input.decisionId);

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "ReasonChanged",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        reason: input.reason ?? null,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async changeDecisionStatus(
    command: ChangeDecisionStatusCommand,
  ): Promise<CommandResult> {
    const input = parseCommand(changeDecisionStatusCommandSchema, command);
    await this.requireDecision(input.projectId, input.actorId, input.decisionId);

    const event = {
      projectId: input.projectId,
      aggregateId: input.decisionId,
      aggregateType: "decision",
      type: "DecisionStatusChanged",
      actorId: input.actorId,
      payload: {
        decisionId: input.decisionId,
        status: input.status,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async createRelation(command: CreateRelationCommand): Promise<CommandResult> {
    const input = parseCommand(createRelationCommandSchema, command);
    const state = await this.loadAuthorizedState(input.projectId, input.actorId);
    const relationId = input.relationId ?? crypto.randomUUID();

    if (!state.decisions[input.fromDecisionId]) {
      throw new CommandNotFoundError(`Decision ${input.fromDecisionId} not found.`);
    }

    if (!state.decisions[input.toDecisionId]) {
      throw new CommandNotFoundError(`Decision ${input.toDecisionId} not found.`);
    }

    if (input.fromDecisionId === input.toDecisionId) {
      throw new CommandValidationError("A decision cannot relate to itself.");
    }

    if (state.relations[relationId]) {
      throw new CommandValidationError(`Relation ${relationId} already exists.`);
    }

    const event = {
      projectId: input.projectId,
      aggregateId: relationId,
      aggregateType: "relation",
      type: "RelationCreated",
      actorId: input.actorId,
      payload: {
        relationId,
        fromDecisionId: input.fromDecisionId,
        toDecisionId: input.toDecisionId,
        type: input.type,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  async removeRelation(command: RemoveRelationCommand): Promise<CommandResult> {
    const input = parseCommand(removeRelationCommandSchema, command);
    const state = await this.loadAuthorizedState(input.projectId, input.actorId);

    if (!state.relations[input.relationId]) {
      throw new CommandNotFoundError(`Relation ${input.relationId} not found.`);
    }

    const event = {
      projectId: input.projectId,
      aggregateId: input.relationId,
      aggregateType: "relation",
      type: "RelationRemoved",
      actorId: input.actorId,
      payload: {
        relationId: input.relationId,
      },
    } satisfies ProjectEventDraft;

    return this.appendAndRebuild(input.projectId, input.expectedVersion, [event]);
  }

  private async requireDecision(
    projectId: string,
    actorId: string,
    decisionId: string,
  ) {
    const state = await this.loadAuthorizedState(projectId, actorId);

    if (!state.decisions[decisionId]) {
      throw new CommandNotFoundError(`Decision ${decisionId} not found.`);
    }

    return state;
  }

  private async loadAuthorizedState(projectId: string, actorId: string) {
    const events = await this.eventStore.getEvents(projectId);
    const state = reduceProjectEvents(events);

    if (!state) {
      throw new CommandNotFoundError(`Project ${projectId} not found.`);
    }

    if (state.ownerId !== actorId) {
      throw new CommandAuthorizationError();
    }

    return state;
  }

  private async appendAndRebuild(
    projectId: string,
    expectedVersion: number,
    events: readonly ProjectEventDraft[],
  ): Promise<CommandResult> {
    const savedEvents = await this.eventStore.append({
      projectId,
      expectedVersion,
      events,
    });
    const allEvents = await this.eventStore.getEvents(projectId);
    const state = reduceProjectEvents(allEvents);

    if (!state) {
      throw new CommandNotFoundError(`Project ${projectId} not found after append.`);
    }

    return {
      events: savedEvents,
      state,
    };
  }
}

function parseCommand<Schema extends z.ZodType>(
  schema: Schema,
  command: z.input<Schema>,
): z.output<Schema> {
  const parsed = schema.safeParse(command);

  if (!parsed.success) {
    throw new CommandValidationError(parsed.error.issues[0]?.message ?? "Invalid command.");
  }

  return parsed.data;
}
