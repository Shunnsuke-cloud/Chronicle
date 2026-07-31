import { describe, expect, it } from "vitest";
import { ProjectCommandService } from "@/application/commands";
import {
  ProjectQueryService,
  QueryAuthorizationError,
  QueryNotFoundError,
} from "@/application/queries";
import { InMemoryProjectEventStore } from "@/infrastructure/event-store";
import { InMemoryProjectReader } from "@/infrastructure/project-reader";

describe("ProjectQueryService", () => {
  it("lists projects owned by the actor", async () => {
    const { queries } = await setupProject();

    const projects = await queries.listProjects("user-1");

    expect(projects).toHaveLength(1);
    expect(projects[0]?.name).toBe("Chronicle");
  });

  it("rebuilds current and past project state", async () => {
    const { queries, projectId } = await setupProject();

    const current = await queries.getProjectState(projectId, "user-1");
    const past = await queries.getProjectStateAtVersion(projectId, "user-1", 2);

    expect(current.version).toBe(6);
    expect(current.decisions["decision-1"]?.selectedAlternativeId).toBe("alternative-1");
    expect(past.version).toBe(2);
    expect(past.decisions["decision-1"]?.selectedAlternativeId).toBeNull();
  });

  it("compares a past version with current state", async () => {
    const { queries, projectId } = await setupProject();

    const comparison = await queries.compareProjectVersions(projectId, "user-1", 2);

    expect(comparison.diff.fromVersion).toBe(2);
    expect(comparison.diff.toVersion).toBe(6);
    expect(comparison.diff.changedDecisionIds).toEqual(["decision-1"]);
    expect(comparison.diff.addedDecisionIds).toEqual(["decision-2"]);
  });

  it("returns React Flow compatible graph data", async () => {
    const { queries, projectId } = await setupProject();

    const graph = await queries.getProjectGraph(projectId, "user-1");

    expect(graph.nodes.map((node) => node.id)).toEqual(["decision-1", "decision-2"]);
    expect(graph.edges).toEqual([
      {
        id: "relation-1",
        source: "decision-1",
        target: "decision-2",
        type: "depends_on",
        label: "depends_on",
      },
    ]);
  });

  it("rejects reads from non-owners", async () => {
    const { queries, projectId } = await setupProject();

    await expect(queries.getProjectState(projectId, "user-2")).rejects.toBeInstanceOf(
      QueryAuthorizationError,
    );
  });

  it("rejects missing target versions", async () => {
    const { queries, projectId } = await setupProject();

    await expect(
      queries.getProjectStateAtVersion(projectId, "user-1", 99),
    ).rejects.toBeInstanceOf(QueryNotFoundError);
  });
});

async function setupProject() {
  const eventStore = new InMemoryProjectEventStore();
  const projectReader = new InMemoryProjectReader();
  const commands = new ProjectCommandService(eventStore);
  const queries = new ProjectQueryService(eventStore, projectReader);

  const project = await commands.createProject({
    actorId: "user-1",
    name: "Chronicle",
    description: null,
  });

  projectReader.setProject({
    id: project.state.id,
    ownerId: project.state.ownerId,
    name: project.state.name,
    description: project.state.description,
    createdAt: project.state.createdAt,
    updatedAt: project.state.updatedAt,
  });

  const firstDecision = await commands.createDecision({
    actorId: "user-1",
    projectId: project.state.id,
    expectedVersion: project.state.version,
    decisionId: "decision-1",
    title: "Use PostgreSQL",
    description: null,
  });

  const firstAlternative = await commands.addAlternative({
    actorId: "user-1",
    projectId: project.state.id,
    expectedVersion: firstDecision.state.version,
    decisionId: "decision-1",
    alternativeId: "alternative-1",
    title: "Neon",
    description: null,
  });

  const selected = await commands.selectAlternative({
    actorId: "user-1",
    projectId: project.state.id,
    expectedVersion: firstAlternative.state.version,
    decisionId: "decision-1",
    alternativeId: "alternative-1",
  });

  const secondDecision = await commands.createDecision({
    actorId: "user-1",
    projectId: project.state.id,
    expectedVersion: selected.state.version,
    decisionId: "decision-2",
    title: "Use React Flow",
    description: null,
  });

  await commands.createRelation({
    actorId: "user-1",
    projectId: project.state.id,
    expectedVersion: secondDecision.state.version,
    relationId: "relation-1",
    fromDecisionId: "decision-1",
    toDecisionId: "decision-2",
    type: "depends_on",
  });

  return {
    queries,
    projectId: project.state.id,
  };
}
