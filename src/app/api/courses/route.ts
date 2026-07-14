import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, roadmapNodes, enrollments } from "@/lib/db/schema";
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
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = crypto.randomUUID();

  await db.insert(courses).values({
    id,
    title: body.title,
    description: body.description,
    trainerId: body.trainerId,
    status: "published",
    price: body.price ?? 0,
    createdAt: new Date().toISOString(),
  });

  const [course] = await db.select().from(courses).where(eq(courses.id, id));
  return NextResponse.json({ course });
}
