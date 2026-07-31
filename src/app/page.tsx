import Link from "next/link";
import { getCurrentSession } from "@/server/auth/session";

export default async function HomePage() {
  const session = await getCurrentSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Chronicle
        </p>
        <h1 className="text-4xl font-semibold text-neutral-950 sm:text-6xl">
          Decisions deserve history, not just comments.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
          ソフトウェア開発の意思決定、選択肢、判断理由、関係性をイベントとして追記保存するための作業場です。
        </p>
        <div className="mt-10 flex gap-3">
          <Link
            href={session ? "/projects" : "/login"}
            className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
          >
            {session ? "Open projects" : "Log in"}
          </Link>
          {!session ? (
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900"
            >
              Create account
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
