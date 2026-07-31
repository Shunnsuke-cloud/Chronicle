import { redirect } from "next/navigation";
import { ProjectsDashboard } from "@/components/projects/projects-dashboard";
import { getCurrentSession } from "@/server/auth/session";

export default async function ProjectsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return <ProjectsDashboard email={session.user.email} />;
}
