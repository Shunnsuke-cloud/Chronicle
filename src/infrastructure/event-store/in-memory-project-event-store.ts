import type { ProjectEvent } from "@/domain/project/events";
import type { ProjectId } from "@/domain/project/types";
import { EventStoreConcurrencyError } from "@/infrastructure/event-store/errors";
import type {
  AppendProjectEventsInput,
  GetProjectEventsOptions,
  ProjectEventDraft,
  ProjectEventStore,
} from "@/infrastructure/event-store/event-store";

export class InMemoryProjectEventStore implements ProjectEventStore {
  private readonly eventsByProject = new Map<ProjectId, ProjectEvent[]>();

  async append(input: AppendProjectEventsInput): Promise<ProjectEvent[]> {
    const currentEvents = this.eventsByProject.get(input.projectId) ?? [];
    const actualVersion = currentEvents.at(-1)?.version ?? 0;

    if (actualVersion !== input.expectedVersion) {
      throw new EventStoreConcurrencyError(
        input.projectId,
        input.expectedVersion,
        actualVersion,
      );
    }

    const savedEvents = input.events.map((event, index) =>
      materializeDraft(event, input.expectedVersion + index + 1),
    );

    this.eventsByProject.set(input.projectId, [...currentEvents, ...savedEvents]);

    return savedEvents;
  }

  async getEvents(
    projectId: ProjectId,
    options: GetProjectEventsOptions = {},
  ): Promise<ProjectEvent[]> {
    return [...(this.eventsByProject.get(projectId) ?? [])].filter((event) => {
      if (options.toVersion !== undefined && event.version > options.toVersion) {
        return false;
      }

      if (options.toOccurredAt && event.occurredAt > options.toOccurredAt) {
        return false;
      }

      return true;
    });
  }

  async getCurrentVersion(projectId: ProjectId): Promise<number> {
    return this.eventsByProject.get(projectId)?.at(-1)?.version ?? 0;
  }
}

function materializeDraft(event: ProjectEventDraft, version: number): ProjectEvent {
  return {
    ...event,
    id: event.id ?? crypto.randomUUID(),
    version,
    occurredAt: event.occurredAt ?? new Date(),
  } as ProjectEvent;
}
