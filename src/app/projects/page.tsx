import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentSession } from "@/server/auth/session";

export default async function ProjectsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950">Projects</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Signed in as {session.user.email}. Project data arrives in phase 3.
          </p>
        </div>
        <SignOutButton />
      </div>
    </main>
  );
}
