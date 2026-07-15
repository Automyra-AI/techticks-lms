import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.id))
    .orderBy(desc(notifications.createdAt));

  return NextResponse.json({ notifications: all });
}

// Mark one (by id) or all notifications as read.
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  if (body.id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, body.id), eq(notifications.userId, session.id)));
  } else {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, session.id));
  }

  return NextResponse.json({ ok: true });
}
