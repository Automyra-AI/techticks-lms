import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions, users, assignments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

// Student submits an assignment. A student has at most one submission per
// assignment: submitting again updates that row (and sends it back for review)
// instead of adding a second one.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }
  if (!body.githubUrl && !body.content && !body.driveUrl && !body.fileData) {
    return NextResponse.json(
      { error: "Upload a file, paste a link, or add notes" },
      { status: 400 }
    );
  }

  // Guard against a stale session (e.g. after a DB reset) whose user no longer
  // exists — that would fail the studentId foreign key with a cryptic 500.
  const [student] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!student) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign out and sign in again." },
      { status: 401 }
    );
  }
  const [assignment] = await db.select().from(assignments).where(eq(assignments.id, body.assignmentId)).limit(1);
  if (!assignment) {
    return NextResponse.json({ error: "That assignment no longer exists." }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, body.assignmentId),
        eq(submissions.studentId, session.id)
      )
    )
    .limit(1);

  const text = (value: unknown) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed === "" ? null : trimmed;
  };
  const now = new Date().toISOString();
  const id = existing?.id ?? crypto.randomUUID();

  try {
    if (existing) {
      // Re-submission: the form carries the previous text values, so they are the
      // new truth. The uploaded file is the exception — it cannot be pre-filled,
      // so it is kept unless a new one is attached. Marks reset because they
      // belong to the work that was just replaced; feedback stays so the student
      // can still see what the trainer asked for.
      await db
        .update(submissions)
        .set({
          content: text(body.content),
          githubUrl: text(body.githubUrl),
          driveUrl: text(body.driveUrl),
          fileData: body.fileData || existing.fileData,
          fileName: body.fileData ? body.fileName || null : existing.fileName,
          fileType: body.fileData ? body.fileType || null : existing.fileType,
          status: "pending",
          marks: null,
          reviewedAt: null,
          updatedAt: now,
        })
        .where(eq(submissions.id, existing.id));
    } else {
      await db.insert(submissions).values({
        id,
        assignmentId: body.assignmentId,
        studentId: session.id,
        content: text(body.content),
        githubUrl: text(body.githubUrl),
        driveUrl: text(body.driveUrl),
        fileData: body.fileData || null,
        fileName: body.fileName || null,
        fileType: body.fileType || null,
        status: "pending",
        submittedAt: now,
      });
    }
  } catch {
    return NextResponse.json({ error: "Could not submit. Please try again." }, { status: 500 });
  }

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
  return NextResponse.json({ submission, updated: Boolean(existing) });
}

// Trainer/admin grades a submission
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db
    .update(submissions)
    .set({
      status: body.status,
      marks: body.marks,
      feedback: body.feedback,
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(submissions.id, body.id));

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, body.id));
  return NextResponse.json({ submission });
}
