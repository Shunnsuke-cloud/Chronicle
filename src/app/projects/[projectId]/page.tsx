import { redirect } from "next/navigation";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { getCurrentSession } from "@/server/auth/session";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const { projectId } = await params;
  return <ProjectWorkspace projectId={projectId} />;
}
