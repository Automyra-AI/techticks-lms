import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, createToken, hashPassword, verifyPassword } from "@/lib/auth";

// Update the signed-in user's profile.
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  await db
    .update(users)
    .set({
      name: body.name ?? session.name,
      email: body.email ?? session.email,
      github: body.github ?? null,
      linkedin: body.linkedin ?? null,
      phone: body.phone ?? null,
    })
    .where(eq(users.id, session.id));

  const [user] = await db.select().from(users).where(eq(users.id, session.id));

  // Re-issue the session token so the header / auth state reflects the new name & email.
  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

// Change password.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required" },
      { status: 400 }
    );
  }
  if (String(body.newPassword).length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.id));
  if (!user || !(await verifyPassword(body.currentPassword, user.password))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ password: await hashPassword(body.newPassword) })
    .where(eq(users.id, session.id));

  return NextResponse.json({ ok: true });
}
