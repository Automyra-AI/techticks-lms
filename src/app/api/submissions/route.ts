import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions, users, assignments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

// Student submits an assignment
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

  const id = crypto.randomUUID();
  try {
    await db.insert(submissions).values({
      id,
      assignmentId: body.assignmentId,
      studentId: session.id,
      content: body.content ?? null,
      githubUrl: body.githubUrl ?? null,
      driveUrl: body.driveUrl ?? null,
      fileData: body.fileData || null,
      fileName: body.fileName || null,
      fileType: body.fileType || null,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Could not submit. Please try again." }, { status: 500 });
  }

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
  return NextResponse.json({ submission });
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
