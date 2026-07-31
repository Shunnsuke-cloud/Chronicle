"use client";

import { useMemo } from "react";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ProjectGraph } from "@/lib/project-api";

type DecisionNodeData = { label: string; status: string; selectedAlternativeId: string | null };

function DecisionNode({ data }: NodeProps<Node<DecisionNodeData>>) {
  return (
    <div className="min-w-44 border border-neutral-300 bg-white px-3 py-2 shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-emerald-600" />
      <p className="text-sm font-medium text-neutral-900">{data.label}</p>
      <p className="mt-1 text-xs capitalize text-neutral-500">{data.status}</p>
      <Handle type="source" position={Position.Right} className="!bg-emerald-600" />
    </div>
  );
}

const nodeTypes = { decision: DecisionNode };

export function ProjectGraphView({ graph }: { graph: ProjectGraph }) {
  const nodes = useMemo<Node<DecisionNodeData>[]>(
    () => graph.nodes.map((node) => ({ ...node, data: node.data })),
    [graph.nodes],
  );
  const edges = useMemo<Edge[]>(
    () => graph.edges.map((edge) => ({ ...edge, type: "smoothstep", animated: false, label: edge.label, style: { stroke: "#15803d" }, labelStyle: { fill: "#525252", fontSize: 11 } })),
    [graph.edges],
  );

  return (
    <div className="h-[420px] border border-neutral-200 bg-[#fbfcf9]">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.3}>
        <Background gap={18} size={1} color="#d4d4d4" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
