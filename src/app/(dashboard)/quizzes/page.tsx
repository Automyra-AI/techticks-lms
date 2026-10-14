import { getSession } from "@/lib/auth";
import { getQuizzesForStaff, getQuizzesForStudent } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { CreateQuizButton } from "@/components/quizzes/quiz-actions";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { TakeQuiz } from "@/components/quizzes/take-quiz";
import { ReviewAttemptButton } from "@/components/quizzes/review-attempt";
import { Clock, HelpCircle } from "lucide-react";

export default async function QuizzesPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";

  if (isStaff) {
    const quizzes = await getQuizzesForStaff();
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400">Create timed, auto-graded quizzes for students</p>
          </div>
          <CreateQuizButton />
        </div>

        {quizzes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
            No quizzes yet. Create one to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((q) => (
              <QuizCard key={q.id} quiz={q} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student view — take quizzes, see results.
  const quizzes = session ? await getQuizzesForStudent(session.id) : [];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-zinc-400">Timed quizzes — one attempt each, no switching tabs</p>
      </div>

      {quizzes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
          No quizzes available yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((q) => (
            <Card key={q.id} className="group transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-pop)]">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100 transition-colors group-hover:text-[var(--accent)]">{q.title}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {q.questionCount} questions</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {q.timeLimit} min</span>
                    <span>Pass: {q.passingScore}%</span>
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                  {q.attempt ? (
                    <>
                      <span className="text-sm font-bold text-violet-400">{q.attempt.score}/{q.attempt.total}</span>
                      <StatusBadge status={q.attempt.passed ? "approved" : "rejected"} />
                      {q.review && <ReviewAttemptButton title={q.title} review={q.review} />}
                    </>
                  ) : (
                    <TakeQuiz quiz={{ id: q.id, title: q.title, timeLimit: q.timeLimit, passingScore: q.passingScore, questions: q.questions }} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
