"use client";

import { useState } from "react";
import { CourseRoadmap } from "@/components/roadmap/course-roadmap";
import { NodeDetailPanel } from "@/components/shared/content-panels";
import type { RoadmapNodeData } from "@/types";

export function RoadmapClient({ nodes }: { nodes: RoadmapNodeData[] }) {
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);

  const completed = nodes.filter((n) => n.status === "completed").length;
  const pct = nodes.length ? Math.round((completed / nodes.length) * 100) : 0;

  return (
    <div className="flex h-[calc(100vh-128px)] flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Course Roadmap</h2>
          <p className="text-zinc-400">
            Scroll to move through the path · click a topic for details · drag to pan
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-violet-400">{completed}</span> / {nodes.length} topics
            complete
          </p>
          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <CourseRoadmap nodes={nodes} onNodeClick={setSelectedNode} />

        {/* Slide-over detail panel */}
        {selectedNode && (
          <div className="absolute right-3 top-3 bottom-3 z-10 w-full max-w-sm rounded-xl shadow-2xl shadow-black/50">
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
