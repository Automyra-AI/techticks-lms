import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcements, courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  return NextResponse.json({ announcements: all });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const [firstCourse] = await db.select().from(courses).limit(1);

  const id = crypto.randomUUID();
  await db.insert(announcements).values({
    id,
    courseId: body.courseId ?? firstCourse?.id ?? null,
    authorId: session.id,
    title: body.title,
    content: body.content,
    createdAt: new Date().toISOString(),
  });

  const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
  return NextResponse.json({ announcement });
}
