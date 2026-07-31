import type { PrismaClient } from "@prisma/client";
import type {
  ProjectListItem,
  ProjectReader,
} from "@/application/queries/project-reader";
import type { ProjectId } from "@/domain/project/types";

export class PrismaProjectReader implements ProjectReader {
  constructor(private readonly prisma: PrismaClient) {}

  async listProjects(ownerId: string): Promise<ProjectListItem[]> {
    return this.prisma.project.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: projectSelect,
    });
  }

  async getProject(projectId: ProjectId): Promise<ProjectListItem | null> {
    return this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: projectSelect,
    });
  }
}

const projectSelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;
