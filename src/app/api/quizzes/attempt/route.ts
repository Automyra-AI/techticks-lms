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

  return NextResponse.json({ score, total, percent, passed, passingScore: quiz.passingScore ?? 70, reason });
}
