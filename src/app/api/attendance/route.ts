import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendance } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

const VALID = ["present", "late", "absent", "excused"] as const;
type Status = (typeof VALID)[number];

// Trainer/admin marks attendance for a session in one shot.
// Body: { sessionId, records: [{ studentId, status }], clear?: studentId[] }
//
// Only students the trainer actually gave a status are stored — an unmarked
// student has no row at all, so they don't count towards anyone's attendance
// percentage. `clear` removes marks again, for fixing a mis-marked session.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const sessionId: string | undefined = body.sessionId;
  const records: { studentId: string; status: string }[] = Array.isArray(body.records) ? body.records : [];
  const clear: string[] = Array.isArray(body.clear) ? body.clear.filter((id: unknown) => typeof id === "string") : [];
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const clean = records.filter((r) => r.studentId && VALID.includes(r.status as Status));
  if (clean.length === 0 && clear.length === 0) {
    return NextResponse.json({ error: "No records to save" }, { status: 400 });
  }

  const studentIds = clean.map((r) => r.studentId);

  // Replace any existing marks for these students in this session, then insert
  // fresh. Students in `clear` are deleted and not re-inserted.
  const touched = [...new Set([...studentIds, ...clear])];
  if (touched.length) {
    await db
      .delete(attendance)
      .where(and(eq(attendance.sessionId, sessionId), inArray(attendance.studentId, touched)));
  }

  const now = new Date().toISOString();
  if (clean.length) {
    await db.insert(attendance).values(
      clean.map((r) => ({
        id: crypto.randomUUID(),
        sessionId,
        studentId: r.studentId,
        status: r.status as Status,
        markedAt: now,
      }))
    );
  }

  return NextResponse.json({ ok: true, saved: clean.length, cleared: clear.length });
}
