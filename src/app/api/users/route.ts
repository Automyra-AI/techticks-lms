import { NextResponse } from "next/server";
import { and, eq, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  courses,
  enrollments,
  submissions,
  attendance,
  lessonProgress,
  quizAttempts,
  certificates,
  notifications,
  messages,
  announcements,
  weeklyRemarks,
} from "@/lib/db/schema";
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

/**
 * Delete a user and everything that belongs to them.
 *
 * Their own records (submissions, attendance, progress, certificates …) go with
 * them. Content they produced for the course does NOT: a trainer's courses are
 * kept and simply unassigned, and their announcements and weekly remarks are
 * reassigned to the admin doing the deletion, because students still depend on
 * them and the author column cannot be left empty.
 */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (id === session.id) {
    return NextResponse.json(
      { error: "You can't delete your own account while signed in as it." },
      { status: 400 }
    );
  }

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) {
    return NextResponse.json({ error: "That user no longer exists." }, { status: 404 });
  }

  // Never leave the platform without an admin who can get back in.
  if (target.role === "admin") {
    const others = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "admin"), ne(users.id, id)));
    if (others.length === 0) {
      return NextResponse.json(
        { error: "This is the last admin account — promote another admin first." },
        { status: 400 }
      );
    }
  }

  // Course content outlives the person: hand it over rather than delete it.
  await db.update(courses).set({ trainerId: null }).where(eq(courses.trainerId, id));
  await db.update(announcements).set({ authorId: session.id }).where(eq(announcements.authorId, id));
  await db.update(weeklyRemarks).set({ trainerId: session.id }).where(eq(weeklyRemarks.trainerId, id));

  // Everything that is personal to this user.
  await db.delete(submissions).where(eq(submissions.studentId, id));
  await db.delete(attendance).where(eq(attendance.studentId, id));
  await db.delete(lessonProgress).where(eq(lessonProgress.userId, id));
  await db.delete(quizAttempts).where(eq(quizAttempts.studentId, id));
  await db.delete(certificates).where(eq(certificates.userId, id));
  await db.delete(notifications).where(eq(notifications.userId, id));
  await db.delete(weeklyRemarks).where(eq(weeklyRemarks.studentId, id));
  await db.delete(messages).where(or(eq(messages.senderId, id), eq(messages.receiverId, id)));
  await db.delete(enrollments).where(eq(enrollments.userId, id));

  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({ ok: true, deleted: { id, name: target.name, role: target.role } });
}
