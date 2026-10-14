import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { batches, courses, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const isStaff = (role?: string) => role === "admin" || role === "trainer";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await db.select().from(batches);
  return NextResponse.json({ batches: all });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let courseId: string | undefined = body.courseId;
  if (!courseId) {
    const [firstCourse] = await db.select().from(courses).limit(1);
    courseId = firstCourse?.id;
  }
  if (!courseId) return NextResponse.json({ error: "No course available" }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(batches).values({
    id,
    courseId,
    name: body.name.trim(),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    status: body.status ?? "active",
    createdAt: new Date().toISOString(),
  });

  const [batch] = await db.select().from(batches).where(eq(batches.id, id));
  return NextResponse.json({ batch });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db
    .update(batches)
    .set({
      name: body.name,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      status: body.status,
    })
    .where(eq(batches.id, body.id));

  const [batch] = await db.select().from(batches).where(eq(batches.id, body.id));
  return NextResponse.json({ batch });
}

/**
 * Removing a batch does not remove its students — they are simply unassigned,
 * so deleting a cohort by mistake can never take real accounts with it. Work
 * scoped to the batch becomes visible to everyone again rather than vanishing.
 */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const students = await db.select({ id: users.id }).from(users).where(eq(users.batchId, id));
  await db.update(users).set({ batchId: null }).where(eq(users.batchId, id));
  await db.delete(batches).where(eq(batches.id, id));

  return NextResponse.json({ ok: true, unassigned: students.length });
}
