import { getRoadmapNodes } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { RoadmapClient } from "@/components/roadmap/roadmap-client";
import type { RoadmapNodeData } from "@/types";

export default async function RoadmapPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";

  // One roadmap for the class: staff tick topics off, students read the result.
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
    videoUrl: node.videoUrl ?? undefined,
    githubUrl: node.githubUrl ?? undefined,
    slidesUrl: node.slidesUrl ?? undefined,
    notes: node.notes ?? undefined,
  }));

  return <RoadmapClient nodes={roadmapData} canEdit={isStaff} />;
}
