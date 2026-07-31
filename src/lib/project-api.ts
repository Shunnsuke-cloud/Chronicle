import type { ProjectDiff } from "@/domain/project/diff";
import type { ProjectEvent } from "@/domain/project/events";
import type { ProjectState } from "@/domain/project/types";

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectGraph = {
  nodes: Array<{
    id: string;
    type: "decision";
    position: { x: number; y: number };
    data: { label: string; status: string; selectedAlternativeId: string | null };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    label: string;
  }>;
};

export type ProjectComparison = {
  from: ProjectState | null;
  to: ProjectState | null;
  diff: ProjectDiff;
};

type ApiErrorPayload = { error?: { message?: string } };

export class ProjectApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new ProjectApiError(
      payload.error?.message ?? "Request could not be completed.",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export const projectApi = {
  list: async () => (await request<{ projects: ProjectListItem[] }>("/projects")).projects,
  create: (input: { name: string; description?: string | null }) =>
    request<{ state: ProjectState }>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getState: async (projectId: string) =>
    (await request<{ state: ProjectState }>(`/projects/${projectId}/state`)).state,
  getEvents: async (projectId: string) =>
    (await request<{ events: ProjectEvent[] }>(`/projects/${projectId}/events`)).events,
  getGraph: (projectId: string) => request<ProjectGraph>(`/projects/${projectId}/graph`),
  compare: (projectId: string, fromVersion: number, toVersion: number) =>
    request<ProjectComparison>(
      `/projects/${projectId}/compare?fromVersion=${fromVersion}&toVersion=${toVersion}`,
    ),
  command: <T>(projectId: string, command: string, input: Record<string, unknown>) =>
    request<T>(`/projects/${projectId}/commands/${command}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
