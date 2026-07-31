import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentSession } from "@/server/auth/session";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/projects");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
        Chronicle
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
        Create account
      </h1>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Start preserving decision context before it disappears from memory.
      </p>
      <AuthForm mode="register" />
      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-950 underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
