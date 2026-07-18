import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, courses, enrollments } from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const all = await db.select().from(users);
  return NextResponse.json({ users: all.map(({ password: _pw, ...u }) => u) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.name || !body.email || !body.role) {
    return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
  }

  const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    email: body.email,
    password: await hashPassword(body.password || "password123"),
    name: body.name,
    role: body.role,
    phone: body.phone ?? null,
    github: body.github ?? null,
    createdAt: new Date().toISOString(),
  });

  if (body.role === "student") {
    const publishedCourses = await db.select().from(courses).where(eq(courses.status, "published"));
    if (publishedCourses.length > 0) {
      await db.insert(enrollments).values(
        publishedCourses.map((course) => ({
          id: crypto.randomUUID(),
          userId: id,
          courseId: course.id,
          progress: 0,
          enrolledAt: new Date().toISOString(),
        }))
      );
    }
  }

  const [{ password: _pw, ...user }] = await db.select().from(users).where(eq(users.id, id));
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db
    .update(users)
    .set({
      name: body.name,
      email: body.email,
      role: body.role,
      phone: body.phone ?? null,
      github: body.github ?? null,
    })
    .where(eq(users.id, body.id));

  const [{ password: _pw, ...user }] = await db.select().from(users).where(eq(users.id, body.id));
  return NextResponse.json({ user });
}
