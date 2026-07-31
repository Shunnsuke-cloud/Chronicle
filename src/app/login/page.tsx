import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentSession } from "@/server/auth/session";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/projects");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
        Chronicle
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-neutral-950">Log in</h1>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Continue recording the reasons behind your software decisions.
      </p>
      <AuthForm mode="login" />
      <p className="mt-6 text-sm text-neutral-600">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-neutral-950 underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
