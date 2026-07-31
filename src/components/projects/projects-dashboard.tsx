"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { FolderPlus, History, Plus, Sparkles } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { projectApi, type ProjectListItem } from "@/lib/project-api";

export function ProjectsDashboard({ email }: { email: string }) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void projectApi
      .list()
      .then(setProjects)
      .catch((reason: unknown) => setError(messageFrom(reason)))
      .finally(() => setIsLoading(false));
  }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const result = await projectApi.create({ name, description: description || null });
      setProjects((current) => [
        {
          id: result.state.id,
          name: result.state.name,
          description: result.state.description,
          createdAt: result.state.createdAt.toString(),
          updatedAt: result.state.updatedAt.toString(),
        },
        ...current,
      ]);
      setName("");
      setDescription("");
    } catch (reason) {
      setError(messageFrom(reason));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-4">
          <Link href="/projects" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center bg-emerald-600 text-white"><History size={17} /></span>
            Chronicle
          </Link>
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <span className="hidden sm:block">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-5">
            <div>
              <p className="text-sm font-medium text-emerald-700">Decision records</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Projects</h1>
            </div>
            <span className="text-sm text-neutral-500">{projects.length} total</span>
          </div>

          {error ? <p className="mt-5 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
          {isLoading ? <p className="py-10 text-sm text-neutral-500">Loading projects...</p> : null}
          {!isLoading && projects.length === 0 ? (
            <div className="py-14 text-center text-neutral-600">
              <Sparkles className="mx-auto mb-3 text-emerald-600" size={26} />
              <p className="font-medium text-neutral-800">Start with a project.</p>
              <p className="mt-1 text-sm">Its decision history will grow as an append-only event stream.</p>
            </div>
          ) : null}
          <div className="divide-y divide-neutral-200">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group flex items-start justify-between gap-4 py-5">
                <div>
                  <h2 className="font-medium group-hover:text-emerald-700">{project.name}</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-600">{project.description ?? "No description recorded."}</p>
                </div>
                <span className="pt-1 text-sm text-neutral-400">Open</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="h-fit border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-emerald-700" />
            <h2 className="font-semibold">New project</h2>
          </div>
          <form className="mt-5 space-y-4" onSubmit={createProject}>
            <label className="block text-sm font-medium">Name
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={200} className="mt-1.5 w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-medium">Context
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={4} className="mt-1.5 w-full resize-y border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" />
            </label>
            <button disabled={isCreating} className="inline-flex w-full items-center justify-center gap-2 bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              <Plus size={16} /> {isCreating ? "Creating..." : "Create project"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

function messageFrom(reason: unknown) {
  return reason instanceof Error ? reason.message : "Something went wrong.";
}
