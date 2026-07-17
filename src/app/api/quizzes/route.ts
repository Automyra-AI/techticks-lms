import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzes, quizAttempts, courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

type Question = { question: string; options: string[]; correctIndex: number };

function validateQuestions(input: unknown): Question[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const out: Question[] = [];
  for (const q of input) {
    if (!q || typeof q.question !== "string" || !q.question.trim()) return null;
    if (!Array.isArray(q.options) || q.options.length < 2) return null;
    if (q.options.some((o: unknown) => typeof o !== "string" || !o.trim())) return null;
    const idx = Number(q.correctIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return null;
    out.push({ question: q.question.trim(), options: q.options.map((o: string) => o.trim()), correctIndex: idx });
  }
  return out;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const questions = validateQuestions(body.questions);
  if (!questions) {
    return NextResponse.json({ error: "Add at least one question, each with 2+ options and a correct answer" }, { status: 400 });
  }

  let courseId: string | undefined = body.courseId;
  if (!courseId) {
    const [firstCourse] = await db.select().from(courses).limit(1);
    courseId = firstCourse?.id;
  }
  if (!courseId) return NextResponse.json({ error: "No course available" }, { status: 400 });

  const id = crypto.randomUUID();
  await db.insert(quizzes).values({
    id,
    courseId,
    title: body.title,
    questions: JSON.stringify(questions),
    timeLimit: body.timeLimit ?? 10,
    passingScore: body.passingScore ?? 70,
    createdAt: new Date().toISOString(),
  });

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
  return NextResponse.json({ quiz });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.timeLimit !== undefined) updates.timeLimit = body.timeLimit;
  if (body.passingScore !== undefined) updates.passingScore = body.passingScore;
  if (body.questions !== undefined) {
    const questions = validateQuestions(body.questions);
    if (!questions) return NextResponse.json({ error: "Invalid questions" }, { status: 400 });
    updates.questions = JSON.stringify(questions);
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db.update(quizzes).set(updates).where(eq(quizzes.id, body.id));
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, body.id));
  return NextResponse.json({ quiz });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const attemptIds = (await db.select({ id: quizAttempts.id }).from(quizAttempts).where(eq(quizAttempts.quizId, id))).map((a) => a.id);
  if (attemptIds.length) await db.delete(quizAttempts).where(inArray(quizAttempts.id, attemptIds));
  await db.delete(quizzes).where(eq(quizzes.id, id));
  return NextResponse.json({ ok: true });
}
