import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

// Student submits an assignment
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }
  if (!body.githubUrl && !body.content && !body.driveUrl) {
    return NextResponse.json(
      { error: "Provide a GitHub link, drive link, or notes" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await db.insert(submissions).values({
    id,
    assignmentId: body.assignmentId,
    studentId: session.id,
    content: body.content ?? null,
    githubUrl: body.githubUrl ?? null,
    driveUrl: body.driveUrl ?? null,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });

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
