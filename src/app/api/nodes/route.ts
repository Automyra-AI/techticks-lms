import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roadmapNodes, lessonProgress } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

/**
 * Update a roadmap node.
 *
 * The roadmap itself belongs to the course, so only admins and trainers may
 * change a node's shared status — a student ticking a topic off would otherwise
 * change the roadmap for everyone. A student's "completed" is recorded against
 * their own lesson_progress row instead, which is what their roadmap and
 * dashboard read back.
 */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const [node] = await db.select().from(roadmapNodes).where(eq(roadmapNodes.id, body.id)).limit(1);
  if (!node) return NextResponse.json({ error: "That topic no longer exists." }, { status: 404 });

  const isStaff = session.role === "admin" || session.role === "trainer";
  const status = body.status ?? "completed";
  const completed = status === "completed";

  // Editing the roadmap — staff only.
  if (isStaff) {
    await db.update(roadmapNodes).set({ status }).where(eq(roadmapNodes.id, body.id));
  }

  // Personal progress — everyone, including staff previewing the course.
  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.nodeId, body.id), eq(lessonProgress.userId, session.id)))
    .limit(1);

  if (existing) {
    await db
      .update(lessonProgress)
      .set({ progress: completed ? 100 : 45, completed, updatedAt: new Date().toISOString() })
      .where(eq(lessonProgress.id, existing.id));
  } else {
    await db.insert(lessonProgress).values({
      id: crypto.randomUUID(),
      userId: session.id,
      nodeId: body.id,
      progress: completed ? 100 : 45,
      completed,
      updatedAt: new Date().toISOString(),
    });
  }

  const [updated] = await db.select().from(roadmapNodes).where(eq(roadmapNodes.id, body.id));
  return NextResponse.json({ node: { ...updated, status: isStaff ? updated.status : status } });
}
