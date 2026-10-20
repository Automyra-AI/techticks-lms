import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  presentations,
  presentationGroups,
  presentationMembers,
  courses,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const isStaff = (role?: string) => role === "admin" || role === "trainer";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let courseId: string | undefined = body.courseId;
  if (!courseId) {
    const [firstCourse] = await db.select().from(courses).limit(1);
    courseId = firstCourse?.id;
  }
  if (!courseId) return NextResponse.json({ error: "No course available" }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(presentations).values({
    id,
    courseId,
    batchId: body.batchId || null,
    title: body.title.trim(),
    description: body.description || null,
    mode: body.mode === "individual" ? "individual" : "group",
    scheduledAt: body.scheduledAt || null,
    createdAt: new Date().toISOString(),
  });

  const [created] = await db.select().from(presentations).where(eq(presentations.id, id));
  return NextResponse.json({ presentation: created });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db
    .update(presentations)
    .set({
      title: body.title,
      description: body.description || null,
      batchId: body.batchId || null,
      mode: body.mode === "individual" ? "individual" : "group",
      scheduledAt: body.scheduledAt || null,
    })
    .where(eq(presentations.id, body.id));

  const [updated] = await db.select().from(presentations).where(eq(presentations.id, body.id));
  return NextResponse.json({ presentation: updated });
}

/** Removes the round along with its groups and their memberships. */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const groups = await db
    .select({ id: presentationGroups.id })
    .from(presentationGroups)
    .where(eq(presentationGroups.presentationId, id));

  if (groups.length) {
    await db.delete(presentationMembers).where(
      inArray(
        presentationMembers.groupId,
        groups.map((g) => g.id)
      )
    );
  }
  await db.delete(presentationGroups).where(eq(presentationGroups.presentationId, id));
  await db.delete(presentations).where(eq(presentations.id, id));

  return NextResponse.json({ ok: true });
}
