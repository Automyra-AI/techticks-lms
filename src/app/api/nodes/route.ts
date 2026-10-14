import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roadmapNodes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

/**
 * Mark a roadmap topic as covered.
 *
 * The roadmap belongs to the course, and topics are ticked off by whoever
 * teaches them — so this is staff only. Students read the same shared status;
 * they do not record progress of their own.
 */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const [node] = await db.select().from(roadmapNodes).where(eq(roadmapNodes.id, body.id)).limit(1);
  if (!node) return NextResponse.json({ error: "That topic no longer exists." }, { status: 404 });

  if (session.role !== "admin" && session.role !== "trainer") {
    return NextResponse.json(
      { error: "Only a trainer or admin can mark a topic as covered." },
      { status: 403 }
    );
  }

  const status = body.status ?? "completed";
  await db.update(roadmapNodes).set({ status }).where(eq(roadmapNodes.id, body.id));

  const [updated] = await db.select().from(roadmapNodes).where(eq(roadmapNodes.id, body.id));
  return NextResponse.json({ node: updated });
}
