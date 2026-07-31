import type { ProjectEvent } from "@/domain/project/events";
import type { ProjectId } from "@/domain/project/types";

export type ProjectEventDraft = ProjectEvent extends infer Event
  ? Event extends ProjectEvent
    ? Omit<Event, "id" | "version" | "occurredAt"> & {
        id?: string;
        occurredAt?: Date;
      }
    : never
  : never;

export type AppendProjectEventsInput = {
  projectId: ProjectId;
  expectedVersion: number;
  events: readonly ProjectEventDraft[];
};

export type GetProjectEventsOptions = {
  toVersion?: number;
  toOccurredAt?: Date;
};

export interface ProjectEventStore {
  append(input: AppendProjectEventsInput): Promise<ProjectEvent[]>;
  getEvents(
    projectId: ProjectId,
    options?: GetProjectEventsOptions,
  ): Promise<ProjectEvent[]>;
  getCurrentVersion(projectId: ProjectId): Promise<number>;
}
