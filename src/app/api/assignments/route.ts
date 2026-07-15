import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assignments, courses } from "@/lib/db/schema";
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
    createdAt: new Date().toISOString(),
  });

  const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
  return NextResponse.json({ assignment });
}
