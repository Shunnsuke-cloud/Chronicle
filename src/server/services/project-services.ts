import { ProjectCommandService } from "@/application/commands";
import { ProjectQueryService } from "@/application/queries";
import { PrismaProjectEventStore } from "@/infrastructure/event-store";
import { PrismaProjectReader } from "@/infrastructure/project-reader";
import { prisma } from "@/server/db/prisma";

const eventStore = new PrismaProjectEventStore(prisma);
const projectReader = new PrismaProjectReader(prisma);

export const projectCommandService = new ProjectCommandService(eventStore);
export const projectQueryService = new ProjectQueryService(eventStore, projectReader);
