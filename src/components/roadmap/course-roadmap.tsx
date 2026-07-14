"use client";

import { memo, useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { DIFFICULTY_COLORS } from "@/lib/constants";
import type { RoadmapNodeData } from "@/types";
import { Filter, Lock, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusIcons = {
  locked: Lock,
  completed: CheckCircle2,
  in_progress: PlayCircle,
  not_started: Circle,
};

function RoadmapNodeComponent({ data }: { data: RoadmapNodeData & { selected?: boolean } }) {
  const StatusIcon = statusIcons[data.status];
  const isLocked = data.status === "locked";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-violet-500 !w-2 !h-2 !border-0" />
      <div
        className={cn(
          "w-[280px] rounded-xl border bg-zinc-900 p-4 shadow-xl transition-all cursor-pointer",
          data.selected ? "border-violet-500 ring-2 ring-violet-500/30" : "border-zinc-700 hover:border-violet-500/50",
          isLocked && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={cn(
                "h-4 w-4 shrink-0",
                data.status === "completed" && "text-emerald-400",
                data.status === "in_progress" && "text-amber-400",
                data.status === "locked" && "text-zinc-500",
                data.status === "not_started" && "text-zinc-600"
              )}
            />
            <h3 className="text-sm font-semibold text-zinc-100">{data.title}</h3>
          </div>
        </div>

        {data.description && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{data.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs capitalize",
              DIFFICULTY_COLORS[data.difficulty]
            )}
          >
            {data.difficulty}
          </span>
          {data.duration && (
            <span className="text-xs text-zinc-500">{data.duration}</span>
          )}
        </div>

        {data.completionPercent !== undefined && data.status !== "locked" && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${data.completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-violet-500 !w-2 !h-2 !border-0" />
    </>
  );
}

const nodeTypes = {
  roadmapNode: memo(RoadmapNodeComponent),
};

interface CourseRoadmapProps {
  nodes: RoadmapNodeData[];
  onNodeClick?: (node: RoadmapNodeData) => void;
}

export function CourseRoadmap({ nodes: roadmapNodes, onNodeClick }: CourseRoadmapProps) {
  const [filter, setFilter] = useState<"all" | "incomplete" | "completed">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredNodes = useMemo(() => {
    if (filter === "all") return roadmapNodes;
    if (filter === "completed") return roadmapNodes.filter((n) => n.status === "completed");
    return roadmapNodes.filter((n) => n.status !== "completed" && n.status !== "locked");
  }, [roadmapNodes, filter]);

  const initialNodes: Node[] = useMemo(
    () =>
      filteredNodes.map((node, index) => ({
        id: node.id,
        type: "roadmapNode",
        position: { x: 400, y: index * 180 },
        data: { ...node, selected: node.id === selectedId },
        draggable: true,
      })),
    [filteredNodes, selectedId]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      filteredNodes.slice(0, -1).map((node, index) => ({
        id: `e-${node.id}-${filteredNodes[index + 1].id}`,
        source: node.id,
        target: filteredNodes[index + 1].id,
        type: "smoothstep",
        animated: filteredNodes[index + 1].status === "in_progress",
        style: { stroke: "#7c3aed", strokeWidth: 2 },
      })),
    [filteredNodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as RoadmapNodeData;
      if (nodeData.status === "locked") return;
      setSelectedId(node.id);
      onNodeClick?.(nodeData);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, selected: n.id === node.id },
        }))
      );
    },
    [onNodeClick, setNodes]
  );

  return (
    <div className="h-[calc(100vh-200px)] w-full rounded-xl border border-zinc-800 bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#27272a" gap={20} />
        <Controls className="!bg-zinc-900 !border-zinc-700 !rounded-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300" />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
          nodeColor={(node) => {
            const status = (node.data as RoadmapNodeData).status;
            if (status === "completed") return "#10b981";
            if (status === "in_progress") return "#f59e0b";
            return "#52525b";
          }}
        />
        <Panel position="top-left" className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            <Filter className="h-3 w-3" /> All
          </Button>
          <Button
            variant={filter === "incomplete" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("incomplete")}
          >
            Incomplete
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
