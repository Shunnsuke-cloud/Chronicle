import Link from "next/link";

export default function HomePage() {
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
            href="/projects"
            className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
          >
            Open projects
          </Link>
        </div>
      </div>
    </main>
  );
}
