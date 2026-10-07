import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzes, quizAttempts, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

type Question = { question: string; options: string[]; correctIndex: number };
const REASONS = ["completed", "timeout", "tab_switch"];

// Student submits a quiz attempt. Grading happens here (server-side) so the
// correct answers never reach the browser. One attempt per student per quiz.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [student] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!student) {
    return NextResponse.json({ error: "Your session is out of date. Please sign out and sign in again." }, { status: 401 });
  }

  const body = await request.json();
  const quizId: string | undefined = body.quizId;
  if (!quizId) return NextResponse.json({ error: "quizId is required" }, { status: 400 });
  const answers: number[] = Array.isArray(body.answers) ? body.answers : [];
  const reason = REASONS.includes(body.reason) ? body.reason : "completed";

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Block retakes.
  const [existing] = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, session.id)))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "You have already attempted this quiz.", attempt: { score: existing.score, total: existing.total, passed: existing.passed } },
      { status: 409 }
    );
  }

  let questions: Question[] = [];
  try {
    questions = JSON.parse(quiz.questions);
  } catch {
    return NextResponse.json({ error: "Quiz is misconfigured" }, { status: 500 });
  }

  const total = questions.length;
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const percent = total ? Math.round((score / total) * 100) : 0;
  const passed = percent >= (quiz.passingScore ?? 70);

  await db.insert(quizAttempts).values({
    id: crypto.randomUUID(),
    quizId,
    studentId: session.id,
    answers: JSON.stringify(answers),
    score,
    total,
    passed,
    reason,
    submittedAt: new Date().toISOString(),
  });

  // The attempt is spent, so it is safe to hand back the answer key — this is
  // what the student reviews to see which questions they got wrong.
  const review = questions.map((q, i) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    chosenIndex: typeof answers[i] === "number" ? answers[i] : -1,
    correct: answers[i] === q.correctIndex,
  }));

  return NextResponse.json({
    score,
    total,
    percent,
    passed,
    passingScore: quiz.passingScore ?? 70,
    reason,
    review,
  });
}

/**
 * Staff clears a student's attempt so they can sit the quiz again — for the
 * student whose browser lost focus and auto-submitted, or when the answer key
 * was wrong at the time they took it.
 */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "trainer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get("quizId");
  const studentId = searchParams.get("studentId");
  if (!quizId || !studentId) {
    return NextResponse.json({ error: "quizId and studentId are required" }, { status: 400 });
  }

  const [attempt] = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentId)))
    .limit(1);
  if (!attempt) {
    return NextResponse.json({ error: "That student has no attempt to reset." }, { status: 404 });
  }

  await db
    .delete(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentId)));

  return NextResponse.json({ ok: true, cleared: { score: attempt.score, total: attempt.total } });
}
