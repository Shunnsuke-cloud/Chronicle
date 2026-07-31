import { diffProjectStates, type ProjectDiff } from "@/domain/project/diff";
import type { ProjectEvent } from "@/domain/project/events";
import { reduceProjectEvents } from "@/domain/project/reducer";
import type {
  DecisionId,
  ProjectId,
  ProjectState,
  RelationId,
} from "@/domain/project/types";
import type { ProjectEventStore } from "@/infrastructure/event-store";
import {
  QueryAuthorizationError,
  QueryNotFoundError,
} from "@/application/queries/errors";
import type {
  ProjectListItem,
  ProjectReader,
} from "@/application/queries/project-reader";

export type ProjectGraphNode = {
  id: DecisionId;
  type: "decision";
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    status: string;
    selectedAlternativeId: string | null;
  };
};

export type ProjectGraphEdge = {
  id: RelationId;
  source: DecisionId;
  target: DecisionId;
  type: string;
  label: string;
};

export type ProjectGraph = {
  nodes: ProjectGraphNode[];
  edges: ProjectGraphEdge[];
};

export type ProjectComparison = {
  from: ProjectState | null;
  to: ProjectState | null;
  diff: ProjectDiff;
};

export class ProjectQueryService {
  constructor(
    private readonly eventStore: ProjectEventStore,
    private readonly projectReader: ProjectReader,
  ) {}

  async listProjects(actorId: string): Promise<ProjectListItem[]> {
    return this.projectReader.listProjects(actorId);
  }

  async getProjectEvents(
    projectId: ProjectId,
    actorId: string,
  ): Promise<ProjectEvent[]> {
    await this.requireProjectOwner(projectId, actorId);
    return this.eventStore.getEvents(projectId);
  }

  async getProjectState(
    projectId: ProjectId,
    actorId: string,
  ): Promise<ProjectState> {
    await this.requireProjectOwner(projectId, actorId);
    return this.rebuildRequiredState(projectId);
  }

  async getProjectStateAtVersion(
    projectId: ProjectId,
    actorId: string,
    version: number,
  ): Promise<ProjectState> {
    await this.requireProjectOwner(projectId, actorId);

    if (!Number.isInteger(version) || version < 1) {
      throw new QueryNotFoundError(`Project version ${version} not found.`);
    }

    const events = await this.eventStore.getEvents(projectId, { toVersion: version });
    const state = reduceProjectEvents(events);

    if (!state || state.version !== version) {
      throw new QueryNotFoundError(`Project version ${version} not found.`);
    }

    return state;
  }

  async getProjectStateAtTime(
    projectId: ProjectId,
    actorId: string,
    occurredAt: Date,
  ): Promise<ProjectState> {
    await this.requireProjectOwner(projectId, actorId);
    const events = await this.eventStore.getEvents(projectId, { toOccurredAt: occurredAt });
    const state = reduceProjectEvents(events);

    if (!state) {
      throw new QueryNotFoundError(
        `Project state before ${occurredAt.toISOString()} not found.`,
      );
    }

    return state;
  }

  async compareProjectVersions(
    projectId: ProjectId,
    actorId: string,
    fromVersion: number,
    toVersion?: number,
  ): Promise<ProjectComparison> {
    await this.requireProjectOwner(projectId, actorId);
    const from = await this.getProjectStateAtVersion(projectId, actorId, fromVersion);
    const to =
      toVersion === undefined
        ? await this.getProjectState(projectId, actorId)
        : await this.getProjectStateAtVersion(projectId, actorId, toVersion);

    return {
      from,
      to,
      diff: diffProjectStates(from, to),
    };
  }

  async getProjectGraph(projectId: ProjectId, actorId: string): Promise<ProjectGraph> {
    const state = await this.getProjectState(projectId, actorId);
    return toProjectGraph(state);
  }

  private async rebuildRequiredState(projectId: ProjectId) {
    const events = await this.eventStore.getEvents(projectId);
    const state = reduceProjectEvents(events);

    if (!state) {
      throw new QueryNotFoundError(`Project ${projectId} not found.`);
    }

    return state;
  }

  private async requireProjectOwner(projectId: ProjectId, actorId: string) {
    const project = await this.projectReader.getProject(projectId);

    if (!project) {
      throw new QueryNotFoundError(`Project ${projectId} not found.`);
    }

    if (project.ownerId !== actorId) {
      throw new QueryAuthorizationError();
    }
  }
}

export function toProjectGraph(state: ProjectState): ProjectGraph {
  const decisions = Object.values(state.decisions);

  return {
    nodes: decisions.map((decision, index) => ({
      id: decision.id,
      type: "decision",
      position: {
        x: (index % 3) * 320,
        y: Math.floor(index / 3) * 180,
      },
      data: {
        label: decision.title,
        status: decision.status,
        selectedAlternativeId: decision.selectedAlternativeId,
      },
    })),
    edges: Object.values(state.relations).map((relation) => ({
      id: relation.id,
      source: relation.fromDecisionId,
      target: relation.toDecisionId,
      type: relation.type,
      label: relation.type,
    })),
  };
}
