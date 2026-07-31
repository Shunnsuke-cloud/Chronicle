import { Prisma, type PrismaClient } from "@prisma/client";
import type { ProjectEvent } from "@/domain/project/events";
import type { ProjectId } from "@/domain/project/types";
import { EventStoreConcurrencyError } from "@/infrastructure/event-store/errors";
import type {
  AppendProjectEventsInput,
  GetProjectEventsOptions,
  ProjectEventDraft,
  ProjectEventStore,
} from "@/infrastructure/event-store/event-store";
import {
  toPrismaJson,
  toProjectEvent,
} from "@/infrastructure/event-store/project-event-mapper";

export class PrismaProjectEventStore implements ProjectEventStore {
  constructor(private readonly prisma: PrismaClient) {}

  async append(input: AppendProjectEventsInput): Promise<ProjectEvent[]> {
    if (input.events.length === 0) {
      return [];
    }

    const occurredAt = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const actualVersion = await getCurrentVersion(tx, input.projectId);

        if (actualVersion !== input.expectedVersion) {
          throw new EventStoreConcurrencyError(
            input.projectId,
            input.expectedVersion,
            actualVersion,
          );
        }

        const savedEvents = input.events.map((event, index) =>
          materializeDraft(event, input.expectedVersion + index + 1, occurredAt),
        );

        await persistProjectMetadata(tx, savedEvents);

        await tx.event.createMany({
          data: savedEvents.map((event) => ({
            id: event.id,
            projectId: event.projectId,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            type: event.type,
            version: event.version,
            actorId: event.actorId,
            payload: toPrismaJson(event.payload),
            occurredAt: event.occurredAt,
          })),
        });

        return savedEvents;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const actualVersion = await this.getCurrentVersion(input.projectId);
        throw new EventStoreConcurrencyError(
          input.projectId,
          input.expectedVersion,
          actualVersion,
        );
      }

      throw error;
    }
  }

  async getEvents(
    projectId: ProjectId,
    options: GetProjectEventsOptions = {},
  ): Promise<ProjectEvent[]> {
    const records = await this.prisma.event.findMany({
      where: {
        projectId,
        ...(options.toVersion !== undefined
          ? {
              version: {
                lte: options.toVersion,
              },
            }
          : {}),
        ...(options.toOccurredAt
          ? {
              occurredAt: {
                lte: options.toOccurredAt,
              },
            }
          : {}),
      },
      orderBy: {
        version: "asc",
      },
    });

    return records.map(toProjectEvent);
  }

  async getCurrentVersion(projectId: ProjectId): Promise<number> {
    return getCurrentVersion(this.prisma, projectId);
  }
}

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function getCurrentVersion(
  prisma: PrismaClient | TransactionClient,
  projectId: ProjectId,
) {
  const aggregate = await prisma.event.aggregate({
    where: {
      projectId,
    },
    _max: {
      version: true,
    },
  });

  return aggregate._max.version ?? 0;
}

async function persistProjectMetadata(
  prisma: TransactionClient,
  events: readonly ProjectEvent[],
) {
  const projectCreated = events.find((event) => event.type === "ProjectCreated");

  if (projectCreated) {
    await prisma.project.create({
      data: {
        id: projectCreated.payload.projectId,
        ownerId: projectCreated.payload.ownerId,
        name: projectCreated.payload.name,
        description: projectCreated.payload.description,
        createdAt: projectCreated.occurredAt,
        updatedAt: projectCreated.occurredAt,
      },
    });
    return;
  }

  const lastEvent = events.at(-1);

  if (lastEvent) {
    await prisma.project.update({
      where: {
        id: lastEvent.projectId,
      },
      data: {
        updatedAt: lastEvent.occurredAt,
      },
    });
  }
}

function materializeDraft(
  event: ProjectEventDraft,
  version: number,
  defaultOccurredAt: Date,
): ProjectEvent {
  return {
    ...event,
    id: event.id ?? crypto.randomUUID(),
    version,
    occurredAt: event.occurredAt ?? defaultOccurredAt,
  } as ProjectEvent;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
