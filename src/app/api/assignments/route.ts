import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, courses, submissions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await db.select().from(assignments).orderBy(desc(assignments.createdAt));
  return NextResponse.json({ assignments: all });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let courseId: string | undefined = body.courseId;
  if (!courseId) {
    const [firstCourse] = await db.select().from(courses).limit(1);
    courseId = firstCourse?.id;
  }
  if (!courseId) {
    return NextResponse.json({ error: "No course available" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await db.insert(assignments).values({
    id,
    courseId,
    title: body.title,
    description: body.description ?? null,
    dueDate: body.dueDate ?? null,
    maxMarks: body.maxMarks ?? 100,
    difficulty: body.difficulty ?? "medium",
    submissionFormat: body.submissionFormat ?? null,
    attachmentUrl: body.attachmentUrl || null,
    attachmentName: body.attachmentName || null,
    attachmentType: body.attachmentType || null,
    attachmentData: body.attachmentData || null,
    createdAt: new Date().toISOString(),
  });

  const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
  return NextResponse.json({ assignment });
}

// Trainer/admin edits an assignment
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const field of ["title", "description", "dueDate", "maxMarks", "difficulty", "submissionFormat"] as const) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  // Attachment: only touch it when the client explicitly sends a value, so an
  // edit that doesn't change the file leaves the existing one intact.
  if (body.attachmentUrl !== undefined) updates.attachmentUrl = body.attachmentUrl || null;
  if (body.attachmentName !== undefined) updates.attachmentName = body.attachmentName || null;
  if (body.attachmentType !== undefined) updates.attachmentType = body.attachmentType || null;
  if (body.attachmentData !== undefined) updates.attachmentData = body.attachmentData || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.update(assignments).set(updates).where(eq(assignments.id, body.id));
  const [assignment] = await db.select().from(assignments).where(eq(assignments.id, body.id));
  return NextResponse.json({ assignment });
}

// Trainer/admin deletes an assignment (and its submissions)
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(submissions).where(eq(submissions.assignmentId, id));
  await db.delete(assignments).where(eq(assignments.id, id));
  return NextResponse.json({ ok: true });
}
