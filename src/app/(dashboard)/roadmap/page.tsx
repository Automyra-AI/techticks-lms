import { getRoadmapNodes, getRoadmapNodesForStudent } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { RoadmapClient } from "@/components/roadmap/roadmap-client";
import type { RoadmapNodeData } from "@/types";

export default async function RoadmapPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";

  // Staff see (and edit) the course roadmap itself; a student sees the same
  // topics with their own progress laid over them.
  const nodes = session && !isStaff
    ? await getRoadmapNodesForStudent(session.id)
    : await getRoadmapNodes();

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
