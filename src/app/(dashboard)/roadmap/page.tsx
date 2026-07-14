import { getRoadmapNodes } from "@/lib/data";
import { RoadmapClient } from "@/components/roadmap/roadmap-client";
import type { RoadmapNodeData } from "@/types";

export default async function RoadmapPage() {
  const nodes = await getRoadmapNodes();

  const roadmapData: RoadmapNodeData[] = nodes.map((node) => ({
    id: node.id,
    title: node.title,
    description: node.description ?? undefined,
    difficulty: node.difficulty ?? "beginner",
    duration: node.duration ?? undefined,
    status: node.status ?? "not_started",
    prerequisites: node.prerequisites ?? undefined,
    completionPercent:
      node.status === "completed" ? 100 : node.status === "in_progress" ? 45 : 0,
  }));

  return <RoadmapClient nodes={roadmapData} />;
}
