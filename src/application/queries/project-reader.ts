import type { ProjectId } from "@/domain/project/types";

export type ProjectListItem = {
  id: ProjectId;
  ownerId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProjectReader {
  listProjects(ownerId: string): Promise<ProjectListItem[]>;
  getProject(projectId: ProjectId): Promise<ProjectListItem | null>;
}
