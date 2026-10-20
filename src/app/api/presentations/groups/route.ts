import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { presentations, presentationGroups, presentationMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const isStaff = (role?: string) => role === "admin" || role === "trainer";

/**
 * Create or update a slot and its members in one call.
 *
 * A slot is a group with a topic; for an individual round it simply holds one
 * student. Members are replaced wholesale rather than diffed, which keeps the
 * client simple — it always sends the full list it wants.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.presentationId) {
    return NextResponse.json({ error: "presentationId is required" }, { status: 400 });
  }

  const [parent] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, body.presentationId))
    .limit(1);
  if (!parent) {
    return NextResponse.json({ error: "That presentation no longer exists." }, { status: 404 });
  }

  const studentIds: string[] = Array.isArray(body.studentIds)
    ? body.studentIds.filter((x: unknown) => typeof x === "string")
    : [];

  // One student per slot when topics are handed out individually.
  if (parent.mode === "individual" && studentIds.length > 1) {
    return NextResponse.json(
      { error: "This round assigns a topic per student, so each slot takes one student." },
      { status: 400 }
    );
  }

  // A student can only hold one slot in a given round.
  if (studentIds.length) {
    const siblings = await db
      .select({ id: presentationGroups.id })
      .from(presentationGroups)
      .where(eq(presentationGroups.presentationId, body.presentationId));
    const otherIds = siblings.map((g) => g.id).filter((id) => id !== body.id);
    if (otherIds.length) {
      const taken = await db
        .select({ studentId: presentationMembers.studentId })
        .from(presentationMembers)
        .where(inArray(presentationMembers.groupId, otherIds));
      const clash = studentIds.find((id) => taken.some((t) => t.studentId === id));
      if (clash) {
        return NextResponse.json(
          { error: "One of those students is already in another group for this presentation." },
          { status: 409 }
        );
      }
    }
  }

  const groupId: string = body.id ?? crypto.randomUUID();

  if (body.id) {
    await db
      .update(presentationGroups)
      .set({ name: body.name, topic: body.topic || null, notes: body.notes || null })
      .where(eq(presentationGroups.id, body.id));
    await db.delete(presentationMembers).where(eq(presentationMembers.groupId, body.id));
  } else {
    const existing = await db
      .select({ id: presentationGroups.id })
      .from(presentationGroups)
      .where(eq(presentationGroups.presentationId, body.presentationId));
    await db.insert(presentationGroups).values({
      id: groupId,
      presentationId: body.presentationId,
      name: body.name?.trim() || `Group ${existing.length + 1}`,
      topic: body.topic || null,
      notes: body.notes || null,
      orderIndex: existing.length,
    });
  }

  if (studentIds.length) {
    await db.insert(presentationMembers).values(
      studentIds.map((studentId) => ({
        id: crypto.randomUUID(),
        groupId,
        studentId,
      }))
    );
  }

  return NextResponse.json({ ok: true, groupId });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(presentationMembers).where(eq(presentationMembers.groupId, id));
  await db.delete(presentationGroups).where(and(eq(presentationGroups.id, id)));

  return NextResponse.json({ ok: true });
}
