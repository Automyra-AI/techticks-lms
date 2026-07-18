import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await db.select().from(resources).orderBy(desc(resources.createdAt));
  return NextResponse.json({ resources: all });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title || !body.category || !body.url) {
    return NextResponse.json({ error: "Title, category, and URL are required" }, { status: 400 });
  }

  const [firstCourse] = await db.select().from(courses).limit(1);

  const id = crypto.randomUUID();
  await db.insert(resources).values({
    id,
    courseId: body.courseId ?? firstCourse?.id,
    title: body.title,
    description: body.description ?? null,
    category: body.category,
    url: body.url,
    fileType: body.fileType ?? null,
    createdAt: new Date().toISOString(),
  });

  const [resource] = await db.select().from(resources).where(eq(resources.id, id));
  return NextResponse.json({ resource });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const field of ["title", "description", "category", "url", "fileType"] as const) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.update(resources).set(updates).where(eq(resources.id, body.id));
  const [resource] = await db.select().from(resources).where(eq(resources.id, body.id));
  return NextResponse.json({ resource });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.delete(resources).where(eq(resources.id, id));
  return NextResponse.json({ ok: true });
}
