import type {
  ProjectListItem,
  ProjectReader,
} from "@/application/queries/project-reader";
import type { ProjectId } from "@/domain/project/types";

export class InMemoryProjectReader implements ProjectReader {
  private readonly projects = new Map<ProjectId, ProjectListItem>();

  setProject(project: ProjectListItem) {
    this.projects.set(project.id, project);
  }

  async listProjects(ownerId: string): Promise<ProjectListItem[]> {
    return [...this.projects.values()]
      .filter((project) => project.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getProject(projectId: ProjectId): Promise<ProjectListItem | null> {
    return this.projects.get(projectId) ?? null;
  }
}
