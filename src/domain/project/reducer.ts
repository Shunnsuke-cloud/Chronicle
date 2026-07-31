import type { ProjectEvent } from "@/domain/project/events";
import type {
  AlternativeId,
  DecisionId,
  ProjectState,
} from "@/domain/project/types";
import { ProjectReducerError } from "@/domain/project/errors";

type MutableProjectState = ProjectState;

export function reduceProjectEvents(events: readonly ProjectEvent[]): ProjectState | null {
  let state: MutableProjectState | null = null;
  let expectedVersion = 1;

  for (const event of events) {
    if (event.version !== expectedVersion) {
      throw new ProjectReducerError(
        `Expected event version ${expectedVersion}, received ${event.version}.`,
      );
    }

    state = applyProjectEvent(state, event);
    expectedVersion += 1;
  }

  return state;
}

export function applyProjectEvent(
  state: ProjectState | null,
  event: ProjectEvent,
): ProjectState {
  if (event.type !== "ProjectCreated" && !state) {
    throw new ProjectReducerError("Project must be created before other events.");
  }

  if (state && event.projectId !== state.id) {
    throw new ProjectReducerError("Event projectId does not match the current state.");
  }

  switch (event.type) {
    case "ProjectCreated": {
      if (state) {
        throw new ProjectReducerError("ProjectCreated cannot be applied twice.");
      }

      if (event.projectId !== event.payload.projectId) {
        throw new ProjectReducerError("ProjectCreated payload projectId mismatch.");
      }

      return {
        id: event.payload.projectId,
        ownerId: event.payload.ownerId,
        name: event.payload.name,
        description: event.payload.description,
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
        version: event.version,
        decisions: {},
        relations: {},
      };
    }

    case "DecisionCreated": {
      const current = requireState(state);
      const decisionId = event.payload.decisionId;

      if (current.decisions[decisionId]) {
        throw new ProjectReducerError(`Decision ${decisionId} already exists.`);
      }

      return touchProject(
        {
          ...current,
          decisions: {
            ...current.decisions,
            [decisionId]: {
              id: decisionId,
              projectId: current.id,
              title: event.payload.title,
              description: event.payload.description,
              status: "draft",
              alternatives: {},
              selectedAlternativeId: null,
              reason: null,
              createdAt: event.occurredAt,
              updatedAt: event.occurredAt,
            },
          },
        },
        event,
      );
    }

    case "DecisionTitleChanged": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => ({
        ...decision,
        title: event.payload.title,
        updatedAt: event.occurredAt,
      }));
    }

    case "DecisionDescriptionChanged": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => ({
        ...decision,
        description: event.payload.description,
        updatedAt: event.occurredAt,
      }));
    }

    case "AlternativeAdded": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => {
        const alternativeId = event.payload.alternativeId;

        if (decision.alternatives[alternativeId]) {
          throw new ProjectReducerError(`Alternative ${alternativeId} already exists.`);
        }

        return {
          ...decision,
          alternatives: {
            ...decision.alternatives,
            [alternativeId]: {
              id: alternativeId,
              decisionId: decision.id,
              title: event.payload.title,
              description: event.payload.description,
              createdAt: event.occurredAt,
              updatedAt: event.occurredAt,
            },
          },
          updatedAt: event.occurredAt,
        };
      });
    }

    case "AlternativeUpdated": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => {
        const alternativeId = event.payload.alternativeId;
        const alternative = requireAlternative(decision.alternatives, alternativeId);

        return {
          ...decision,
          alternatives: {
            ...decision.alternatives,
            [alternativeId]: {
              ...alternative,
              title: event.payload.title,
              description: event.payload.description,
              updatedAt: event.occurredAt,
            },
          },
          updatedAt: event.occurredAt,
        };
      });
    }

    case "AlternativeSelected": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => {
        requireAlternative(decision.alternatives, event.payload.alternativeId);

        return {
          ...decision,
          selectedAlternativeId: event.payload.alternativeId,
          updatedAt: event.occurredAt,
        };
      });
    }

    case "ReasonChanged": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => ({
        ...decision,
        reason: event.payload.reason,
        updatedAt: event.occurredAt,
      }));
    }

    case "DecisionStatusChanged": {
      return updateDecision(state, event.payload.decisionId, event, (decision) => ({
        ...decision,
        status: event.payload.status,
        updatedAt: event.occurredAt,
      }));
    }

    case "RelationCreated": {
      const current = requireState(state);
      const relationId = event.payload.relationId;

      if (current.relations[relationId]) {
        throw new ProjectReducerError(`Relation ${relationId} already exists.`);
      }

      requireDecision(current, event.payload.fromDecisionId);
      requireDecision(current, event.payload.toDecisionId);

      if (event.payload.fromDecisionId === event.payload.toDecisionId) {
        throw new ProjectReducerError("A decision cannot relate to itself.");
      }

      return touchProject(
        {
          ...current,
          relations: {
            ...current.relations,
            [relationId]: {
              id: relationId,
              projectId: current.id,
              fromDecisionId: event.payload.fromDecisionId,
              toDecisionId: event.payload.toDecisionId,
              type: event.payload.type,
              createdAt: event.occurredAt,
            },
          },
        },
        event,
      );
    }

    case "RelationRemoved": {
      const current = requireState(state);
      const relationId = event.payload.relationId;

      if (!current.relations[relationId]) {
        throw new ProjectReducerError(`Relation ${relationId} does not exist.`);
      }

      const remainingRelations = { ...current.relations };
      delete remainingRelations[relationId];

      return touchProject(
        {
          ...current,
          relations: remainingRelations,
        },
        event,
      );
    }
  }
}

function requireState(state: ProjectState | null): ProjectState {
  if (!state) {
    throw new ProjectReducerError("Project state is not initialized.");
  }

  return state;
}

function requireDecision(state: ProjectState, decisionId: DecisionId) {
  const decision = state.decisions[decisionId];

  if (!decision) {
    throw new ProjectReducerError(`Decision ${decisionId} does not exist.`);
  }

  return decision;
}

function requireAlternative(
  alternatives: ProjectState["decisions"][DecisionId]["alternatives"],
  alternativeId: AlternativeId,
) {
  const alternative = alternatives[alternativeId];

  if (!alternative) {
    throw new ProjectReducerError(`Alternative ${alternativeId} does not exist.`);
  }

  return alternative;
}

function updateDecision(
  state: ProjectState | null,
  decisionId: DecisionId,
  event: ProjectEvent,
  update: (
    decision: ProjectState["decisions"][DecisionId],
  ) => ProjectState["decisions"][DecisionId],
): ProjectState {
  const current = requireState(state);
  const decision = requireDecision(current, decisionId);

  return touchProject(
    {
      ...current,
      decisions: {
        ...current.decisions,
        [decisionId]: update(decision),
      },
    },
    event,
  );
}

function touchProject(state: ProjectState, event: ProjectEvent): ProjectState {
  return {
    ...state,
    version: event.version,
    updatedAt: event.occurredAt,
  };
}
