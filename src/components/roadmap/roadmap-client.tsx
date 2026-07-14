"use client";

import { useState } from "react";
import { CourseRoadmap } from "@/components/roadmap/course-roadmap";
import { NodeDetailPanel } from "@/components/shared/content-panels";
import type { RoadmapNodeData } from "@/types";

export function RoadmapClient({ nodes }: { nodes: RoadmapNodeData[] }) {
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Course Roadmap</h2>
        <p className="text-zinc-400">
          Interactive learning path — zoom, pan, and filter topics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CourseRoadmap nodes={nodes} onNodeClick={setSelectedNode} />
        </div>
        <div className="h-[calc(100vh-200px)]">
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      </div>
    </div>
  );
}
