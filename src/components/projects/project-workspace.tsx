"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ChevronRight, GitBranch, History, Plus, RefreshCw } from "lucide-react";
import type { DecisionStatus, ProjectState, RelationType } from "@/domain/project/types";
import { ProjectApiError, projectApi, type ProjectComparison, type ProjectGraph } from "@/lib/project-api";
import { ProjectGraphView } from "@/components/projects/project-graph";

const statuses: DecisionStatus[] = ["draft", "proposed", "accepted", "rejected", "deprecated", "superseded"];
const relationTypes: RelationType[] = ["depends_on", "blocks", "supersedes", "relates_to", "conflicts_with"];

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const [state, setState] = useState<ProjectState | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; version: number; type: string; occurredAt: Date | string; actorId: string }>>([]);
  const [graph, setGraph] = useState<ProjectGraph | null>(null);
  const [comparison, setComparison] = useState<ProjectComparison | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    const [nextState, nextEvents, nextGraph] = await Promise.all([
      projectApi.getState(projectId),
      projectApi.getEvents(projectId),
      projectApi.getGraph(projectId),
    ]);
    setState(nextState);
    setEvents(nextEvents);
    setGraph(nextGraph);
    setSelectedDecisionId((current) => current && nextState.decisions[current] ? current : Object.keys(nextState.decisions)[0] ?? null);
  }, [projectId]);

  useEffect(() => {
    async function loadProject() {
      try {
        await reload();
      } catch (reason) {
        setError(messageFrom(reason));
      } finally {
        setIsLoading(false);
      }
    }

    void loadProject();
  }, [reload]);

  async function runCommand(
    command: string,
    input: Record<string, unknown>,
    expectedVersion = state?.version,
  ): Promise<ProjectState | undefined> {
    if (!state || expectedVersion === undefined) return undefined;
    setError(null);
    setIsSaving(true);
    try {
      const result = await projectApi.command<{ state: ProjectState }>(projectId, command, { ...input, expectedVersion });
      setState(result.state);
      await reload();
      return result.state;
    } catch (reason) {
      setError(reason instanceof ProjectApiError && reason.status === 409 ? "Another update was recorded first. The latest state has been reloaded." : messageFrom(reason));
      if (reason instanceof ProjectApiError && reason.status === 409) await reload();
    } finally {
      setIsSaving(false);
    }
  }

  async function compare(fromVersion: number) {
    if (!state) return;
    try {
      setComparison(await projectApi.compare(projectId, fromVersion, state.version));
    } catch (reason) {
      setError(messageFrom(reason));
    }
  }

  if (isLoading) return <main className="grid min-h-screen place-items-center text-sm text-neutral-500">Loading decision history...</main>;
  if (!state) return <main className="grid min-h-screen place-items-center text-sm text-rose-700">{error ?? "Project not found."}</main>;

  const decisions = Object.values(state.decisions);
  const selectedDecision = selectedDecisionId ? state.decisions[selectedDecisionId] : undefined;

  return (
    <main className="min-h-screen bg-[#f6f7f3] text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/projects" className="grid size-8 place-items-center border border-neutral-300 text-neutral-700" aria-label="Back to projects"><ArrowLeft size={16} /></Link>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{state.name}</p><p className="text-xs text-neutral-500">Version {state.version}</p></div>
          </div>
          <button onClick={() => void reload()} className="grid size-8 place-items-center border border-neutral-300 text-neutral-700" aria-label="Refresh project" title="Refresh project"><RefreshCw size={15} /></button>
        </div>
      </header>
      {error ? <p className="mx-auto max-w-[1440px] border-l-2 border-rose-500 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="mx-auto grid max-w-[1440px] gap-0 lg:grid-cols-[250px_minmax(0,1fr)_330px]">
        <aside className="border-b border-neutral-200 bg-white lg:min-h-[calc(100vh-57px)] lg:border-b-0 lg:border-r">
          <div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Decisions</p></div>
          <nav className="border-t border-neutral-100">
            {decisions.map((decision) => <button key={decision.id} onClick={() => setSelectedDecisionId(decision.id)} className={`flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 text-left text-sm ${decision.id === selectedDecisionId ? "bg-emerald-50 text-emerald-900" : "hover:bg-neutral-50"}`}><span className="truncate">{decision.title}</span><ChevronRight size={15} /></button>)}
          </nav>
          <CreateDecisionButton onCreate={(title, description) => void runCommand("create-decision", { title, description: description || null })} disabled={isSaving} />
        </aside>

        <section className="min-w-0 border-b border-neutral-200 px-5 py-6 lg:border-b-0">
          {selectedDecision ? <DecisionEditor key={selectedDecision.id} decision={selectedDecision} version={state.version} saving={isSaving} onCommand={runCommand} /> : <div className="py-20 text-center text-sm text-neutral-500">Create a decision to begin its record.</div>}
          <section className="mt-10 border-t border-neutral-200 pt-6">
            <div className="flex items-center gap-2"><GitBranch size={18} className="text-emerald-700" /><h2 className="font-semibold">Decision graph</h2></div>
            <div className="mt-4">{graph ? <ProjectGraphView graph={graph} /> : null}</div>
            {decisions.length > 1 ? <RelationForm decisions={decisions.map(({ id, title }) => ({ id, title }))} disabled={isSaving} onCreate={(input) => void runCommand("create-relation", input)} /> : null}
          </section>
        </section>

        <aside className="bg-white px-5 py-6 lg:border-l lg:border-neutral-200">
          <EventTimeline events={events} activeVersion={state.version} onCompare={compare} />
          {comparison ? <ComparisonSummary comparison={comparison} onClose={() => setComparison(null)} /> : null}
        </aside>
      </div>
    </main>
  );
}

function CreateDecisionButton({ onCreate, disabled }: { onCreate: (title: string, description: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); onCreate(title, description); setTitle(""); setDescription(""); setOpen(false); }
  return open ? <form onSubmit={submit} className="space-y-2 border-t border-neutral-200 p-4"><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Decision title" className="w-full border border-neutral-300 px-2 py-2 text-sm" /><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context" rows={3} className="w-full border border-neutral-300 px-2 py-2 text-sm" /><button disabled={disabled} className="w-full bg-neutral-950 py-2 text-sm text-white">Create</button></form> : <button onClick={() => setOpen(true)} className="m-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><Plus size={16} /> New decision</button>;
}

function DecisionEditor({ decision, version, saving, onCommand }: { decision: NonNullable<ProjectState["decisions"][string]>; version: number; saving: boolean; onCommand: (command: string, input: Record<string, unknown>, expectedVersion?: number) => Promise<ProjectState | undefined> }) {
  const [title, setTitle] = useState(decision.title); const [description, setDescription] = useState(decision.description ?? ""); const [reason, setReason] = useState(decision.reason ?? ""); const [alternativeTitle, setAlternativeTitle] = useState("");
  async function saveDetails(event: FormEvent) { event.preventDefault(); let expectedVersion = version; if (title !== decision.title) { const state = await onCommand("change-decision-title", { decisionId: decision.id, title }, expectedVersion); expectedVersion = state?.version ?? expectedVersion; } if (description !== (decision.description ?? "")) await onCommand("change-decision-description", { decisionId: decision.id, description: description || null }, expectedVersion); }
  async function addAlternative(event: FormEvent) { event.preventDefault(); await onCommand("add-alternative", { decisionId: decision.id, title: alternativeTitle, description: null }); setAlternativeTitle(""); }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Decision</p><select value={decision.status} onChange={(e) => void onCommand("change-decision-status", { decisionId: decision.id, status: e.target.value })} disabled={saving} className="border border-neutral-300 bg-white px-2 py-1.5 text-xs capitalize">{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>
    <form className="mt-3" onSubmit={saveDetails}><input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border-b border-neutral-300 bg-transparent py-2 text-2xl font-semibold outline-none focus:border-emerald-600" /><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the decision context" className="mt-4 w-full resize-y bg-transparent text-sm leading-6 text-neutral-700 outline-none" /><button disabled={saving} className="mt-3 border border-neutral-300 bg-white px-3 py-1.5 text-sm">Save details</button></form>
    <section className="mt-8"><h2 className="font-semibold">Alternatives</h2><div className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">{Object.values(decision.alternatives).map((alternative) => <div key={alternative.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{alternative.title}</p><p className="text-xs text-neutral-500">{alternative.description ?? "No details"}</p></div><button disabled={saving || decision.selectedAlternativeId === alternative.id} onClick={() => void onCommand("select-alternative", { decisionId: decision.id, alternativeId: alternative.id })} className="border border-neutral-300 px-2 py-1 text-xs disabled:border-emerald-600 disabled:bg-emerald-50 disabled:text-emerald-800">{decision.selectedAlternativeId === alternative.id ? "Selected" : "Select"}</button></div>)}</div><form onSubmit={addAlternative} className="mt-3 flex gap-2"><input value={alternativeTitle} onChange={(e) => setAlternativeTitle(e.target.value)} required placeholder="New alternative" className="min-w-0 flex-1 border border-neutral-300 px-3 py-2 text-sm" /><button disabled={saving} className="border border-neutral-300 bg-white px-3 text-sm">Add</button></form></section>
    <section className="mt-8"><h2 className="font-semibold">Reason</h2><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={5} placeholder="Why is this the right choice?" className="mt-3 w-full resize-y border border-neutral-300 bg-white p-3 text-sm leading-6" /><button disabled={saving} onClick={() => void onCommand("change-reason", { decisionId: decision.id, reason: reason || null })} className="mt-2 border border-neutral-300 bg-white px-3 py-1.5 text-sm">Record reason</button></section>
  </>;
}

function RelationForm({ decisions, disabled, onCreate }: { decisions: Array<{ id: string; title: string }>; disabled: boolean; onCreate: (input: Record<string, unknown>) => void }) { const [fromDecisionId, setFrom] = useState(decisions[0]?.id ?? ""); const [toDecisionId, setTo] = useState(decisions[1]?.id ?? ""); const [type, setType] = useState<RelationType>("relates_to"); function submit(e: FormEvent) { e.preventDefault(); onCreate({ fromDecisionId, toDecisionId, type }); } return <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 text-sm"><select value={fromDecisionId} onChange={(e) => setFrom(e.target.value)} className="border border-neutral-300 p-2">{decisions.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select><select value={type} onChange={(e) => setType(e.target.value as RelationType)} className="border border-neutral-300 p-2">{relationTypes.map((type) => <option key={type}>{type}</option>)}</select><select value={toDecisionId} onChange={(e) => setTo(e.target.value)} className="border border-neutral-300 p-2">{decisions.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select><button disabled={disabled || fromDecisionId === toDecisionId} className="border border-neutral-300 bg-white px-3 py-2">Connect</button></form>; }

function EventTimeline({ events, activeVersion, onCompare }: { events: Array<{ id: string; version: number; type: string; occurredAt: Date | string; actorId: string }>; activeVersion: number; onCompare: (version: number) => void }) { return <section><div className="flex items-center gap-2"><History size={18} className="text-emerald-700" /><h2 className="font-semibold">Event history</h2></div><p className="mt-1 text-xs leading-5 text-neutral-500">Every change is retained. Compare any earlier version with the current record.</p><ol className="mt-5 space-y-0">{[...events].reverse().map((event) => <li key={event.id} className="border-l border-neutral-200 pb-4 pl-4 last:pb-0"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{event.type}</p><p className="mt-1 text-xs text-neutral-500">v{event.version} · {new Date(event.occurredAt).toLocaleString()}</p></div>{event.version < activeVersion ? <button onClick={() => onCompare(event.version)} className="text-xs font-medium text-emerald-700">Compare</button> : <span className="text-xs text-emerald-700">Current</span>}</div></li>)}</ol></section>; }

function ComparisonSummary({ comparison, onClose }: { comparison: ProjectComparison; onClose: () => void }) { const changes = useMemo(() => [ ["Added decisions", comparison.diff.addedDecisionIds.length], ["Changed decisions", comparison.diff.changedDecisionIds.length], ["Added relations", comparison.diff.addedRelationIds.length], ["Removed relations", comparison.diff.removedRelationIds.length] ], [comparison]); return <section className="mt-8 border-t border-neutral-200 pt-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Version comparison</h2><button onClick={onClose} className="text-xs text-neutral-500">Close</button></div><p className="mt-1 text-xs text-neutral-500">v{comparison.diff.fromVersion} to v{comparison.diff.toVersion}</p><dl className="mt-3 space-y-2">{changes.map(([label, count]) => <div key={String(label)} className="flex justify-between text-sm"><dt className="text-neutral-600">{label}</dt><dd className="font-medium">{count}</dd></div>)}</dl></section>; }

function messageFrom(reason: unknown) { return reason instanceof Error ? reason.message : "Something went wrong."; }
