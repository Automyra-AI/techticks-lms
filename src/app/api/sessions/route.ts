import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, courses, attendance } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await db.select().from(sessions).orderBy(sessions.scheduledAt);
  return NextResponse.json({ sessions: all });
}

// Trainer/admin schedules a live session
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  let courseId: string | undefined = body.courseId;
  if (!courseId) {
    const [firstCourse] = await db.select().from(courses).limit(1);
    courseId = firstCourse?.id;
  }
  if (!courseId) return NextResponse.json({ error: "No course available" }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(sessions).values({
    id,
    courseId,
    title: body.title,
    description: body.description || null,
    scheduledAt: body.scheduledAt || null,
    duration: body.duration ?? 90,
    meetingPlatform: body.meetingPlatform || null,
    meetingUrl: body.meetingUrl || null,
  });

  const [created] = await db.select().from(sessions).where(eq(sessions.id, id));
  return NextResponse.json({ session: created });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(attendance).where(eq(attendance.sessionId, id));
  await db.delete(sessions).where(eq(sessions.id, id));
  return NextResponse.json({ ok: true });
}
