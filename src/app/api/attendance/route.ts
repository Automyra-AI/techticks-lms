import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendance } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const VALID = ["present", "late", "absent", "excused"] as const;
type Status = (typeof VALID)[number];

// Trainer/admin marks attendance for a session in one shot.
// Body: { sessionId, records: [{ studentId, status }] }
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const sessionId: string | undefined = body.sessionId;
  const records: { studentId: string; status: string }[] = Array.isArray(body.records) ? body.records : [];
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  if (records.length === 0) return NextResponse.json({ error: "No records to save" }, { status: 400 });

  const clean = records.filter((r) => r.studentId && VALID.includes(r.status as Status));
  const studentIds = clean.map((r) => r.studentId);

  // Replace any existing marks for these students in this session, then insert fresh.
  if (studentIds.length) {
    await db
      .delete(attendance)
      .where(and(eq(attendance.sessionId, sessionId), inArray(attendance.studentId, studentIds)));
  }

  const now = new Date().toISOString();
  await db.insert(attendance).values(
    clean.map((r) => ({
      id: crypto.randomUUID(),
      sessionId,
      studentId: r.studentId,
      status: r.status as Status,
      markedAt: now,
    }))
  );

  return NextResponse.json({ ok: true, saved: clean.length });
}
