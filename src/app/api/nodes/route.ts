import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roadmapNodes, lessonProgress } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

// Update a roadmap node's status (e.g. mark as complete) and record lesson progress.
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const status = body.status ?? "completed";
  const completed = status === "completed";

  await db.update(roadmapNodes).set({ status }).where(eq(roadmapNodes.id, body.id));

  // Upsert lesson progress for this student + node
  const [existing] = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.nodeId, body.id));

  if (existing && existing.userId === session.id) {
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

  const [node] = await db.select().from(roadmapNodes).where(eq(roadmapNodes.id, body.id));
  return NextResponse.json({ node });
}
