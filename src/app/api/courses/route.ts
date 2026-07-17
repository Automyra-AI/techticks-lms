import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  courses,
  roadmapNodes,
  enrollments,
  weeks,
  sessions,
  assignments,
  submissions,
  attendance,
  resources,
  announcements,
  weeklyRemarks,
  quizzes,
  certificates,
  lessonProgress,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allCourses = await db.select().from(courses);
  const nodes = await db.select().from(roadmapNodes).orderBy(roadmapNodes.orderIndex);

  return NextResponse.json({ courses: allCourses, roadmapNodes: nodes });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title || !body.description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  // Only attach a trainer that still exists — a stale session (e.g. after a DB
  // reset) would otherwise reference a deleted user and fail the FK constraint.
  const candidateTrainer = body.trainerId ?? (session.role === "trainer" ? session.id : null);
  let trainerId: string | null = null;
  if (candidateTrainer) {
    const [trainer] = await db.select().from(users).where(eq(users.id, candidateTrainer)).limit(1);
    trainerId = trainer?.id ?? null;
  }

  const id = crypto.randomUUID();

  try {
    await db.insert(courses).values({
      id,
      title: body.title,
      description: body.description,
      trainerId,
      status: "published",
      price: body.price ?? 0,
      createdAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Could not create course. Please try again." }, { status: 500 });
  }

  const [course] = await db.select().from(courses).where(eq(courses.id, id));
  return NextResponse.json({ course });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.price !== undefined) updates.price = body.price;
  if (body.status !== undefined) updates.status = body.status;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.update(courses).set(updates).where(eq(courses.id, body.id));
  const [course] = await db.select().from(courses).where(eq(courses.id, body.id));
  return NextResponse.json({ course });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Remove all dependent rows (children before parents) so foreign keys stay valid.
  const nodeIds = (await db.select({ id: roadmapNodes.id }).from(roadmapNodes).where(eq(roadmapNodes.courseId, id))).map((n) => n.id);
  const assignmentIds = (await db.select({ id: assignments.id }).from(assignments).where(eq(assignments.courseId, id))).map((a) => a.id);
  const sessionIds = (await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.courseId, id))).map((s) => s.id);
  const weekIds = (await db.select({ id: weeks.id }).from(weeks).where(eq(weeks.courseId, id))).map((w) => w.id);

  if (assignmentIds.length) await db.delete(submissions).where(inArray(submissions.assignmentId, assignmentIds));
  if (sessionIds.length) await db.delete(attendance).where(inArray(attendance.sessionId, sessionIds));
  if (nodeIds.length) {
    await db.delete(lessonProgress).where(inArray(lessonProgress.nodeId, nodeIds));
    await db.delete(quizzes).where(inArray(quizzes.nodeId, nodeIds));
  }
  if (weekIds.length) await db.delete(weeklyRemarks).where(inArray(weeklyRemarks.weekId, weekIds));

  await db.delete(quizzes).where(eq(quizzes.courseId, id));
  await db.delete(certificates).where(eq(certificates.courseId, id));
  await db.delete(assignments).where(eq(assignments.courseId, id));
  await db.delete(sessions).where(eq(sessions.courseId, id));
  await db.delete(weeks).where(eq(weeks.courseId, id));
  await db.delete(resources).where(eq(resources.courseId, id));
  await db.delete(announcements).where(eq(announcements.courseId, id));
  await db.delete(enrollments).where(eq(enrollments.courseId, id));
  await db.delete(roadmapNodes).where(eq(roadmapNodes.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));

  return NextResponse.json({ ok: true });
}
