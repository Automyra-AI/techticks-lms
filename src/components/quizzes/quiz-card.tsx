"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { EditQuizButton, DeleteQuizButton } from "@/components/quizzes/quiz-actions";
import { formatDate } from "@/lib/utils";
import { Clock, HelpCircle, AlertTriangle } from "lucide-react";

type QB = { question: string; options: string[]; correctIndex: number };
type Attempt = {
  studentName: string;
  studentEmail: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  reason: string | null;
  submittedAt: string;
};

const reasonLabel: Record<string, string> = {
  timeout: "Time ran out",
  tab_switch: "Left the tab",
  completed: "Completed",
};

export function QuizCard({
  quiz,
}: {
  quiz: {
    id: string;
    title: string;
    timeLimit: number;
    passingScore: number;
    questionCount: number;
    questions: QB[];
    attempts: number;
    passed: number;
    attemptList: Attempt[];
  };
}) {
  const [open, setOpen] = useState(false);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <Card onClick={() => setOpen(true)} className="cursor-pointer transition-colors hover:border-violet-500/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-100">{quiz.title}</p>
            <p className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {quiz.questionCount} questions</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {quiz.timeLimit} min</span>
              <span>Pass: {quiz.passingScore}%</span>
              <span className="text-zinc-400">{quiz.attempts} attempts · {quiz.passed} passed</span>
            </p>
          </div>
          <div className="flex items-center gap-2" onClick={stop}>
            <EditQuizButton quiz={{ id: quiz.id, title: quiz.title, timeLimit: quiz.timeLimit, passingScore: quiz.passingScore, questions: quiz.questions }} />
            <DeleteQuizButton id={quiz.id} title={quiz.title} />
          </div>
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={quiz.title} description="Student results">
        <div className="space-y-4">
          <div className="flex gap-3 text-sm">
            <div className="flex-1 rounded-lg border border-zinc-800 p-3 text-center">
              <p className="text-2xl font-bold text-zinc-100">{quiz.attempts}</p>
              <p className="text-xs text-zinc-500">Attempts</p>
            </div>
            <div className="flex-1 rounded-lg border border-zinc-800 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{quiz.passed}</p>
              <p className="text-xs text-zinc-500">Passed</p>
            </div>
            <div className="flex-1 rounded-lg border border-zinc-800 p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{quiz.attempts - quiz.passed}</p>
              <p className="text-xs text-zinc-500">Not passed</p>
            </div>
          </div>

          {quiz.attemptList.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No student has attempted this quiz yet.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {quiz.attemptList.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{a.studentName}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {formatDate(a.submittedAt)}
                      {a.reason && a.reason !== "completed" && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> {reasonLabel[a.reason] ?? a.reason}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-violet-400">{a.score}/{a.total} · {a.percent}%</span>
                    <StatusBadge status={a.passed ? "approved" : "rejected"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
