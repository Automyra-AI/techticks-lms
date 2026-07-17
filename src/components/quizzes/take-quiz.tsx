"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

type Q = { question: string; options: string[] };
type Result = { score: number; total: number; percent: number; passed: boolean; reason: string };

export function TakeQuiz({
  quiz,
}: {
  quiz: { id: string; title: string; timeLimit: number; passingScore: number; questions: Q[] };
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [phase, setPhase] = useState<"closed" | "intro" | "taking" | "result">("closed");
  const [answers, setAnswers] = useState<number[]>(() => quiz.questions.map(() => -1));
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimit * 60);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Submit + grade on the server. Reason records HOW it ended (anti-cheat).
  async function submit(reason: "completed" | "timeout" | "tab_switch") {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    const res = await fetch("/api/quizzes/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id, answers: answersRef.current, reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to submit");
      if (data.attempt) setResult({ ...data.attempt, percent: 0, reason });
      setPhase("result");
      return;
    }
    setResult({ score: data.score, total: data.total, percent: data.percent, passed: data.passed, reason });
    setPhase("result");
    router.refresh();
  }
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Countdown → auto-submit at zero.
  useEffect(() => {
    if (phase !== "taking") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submitRef.current("timeout");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Anti-cheat: leaving the tab/window submits immediately.
  useEffect(() => {
    if (phase !== "taking") return;
    const onHide = () => {
      if (document.hidden) submitRef.current("tab_switch");
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
    };
  }, [phase]);

  // Lock background scroll while the quiz overlay is open.
  useEffect(() => {
    if (phase === "closed") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  function openIntro() {
    setAnswers(quiz.questions.map(() => -1));
    setSecondsLeft(quiz.timeLimit * 60);
    setResult(null);
    setError(null);
    submittingRef.current = false;
    setPhase("intro");
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft <= 60;

  const overlay =
    phase === "closed" ? null : (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {phase === "intro" && (
            <div className="space-y-4 p-6">
              <h3 className="text-xl font-bold text-zinc-100">{quiz.title}</h3>
              <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Read before you start</p>
                <ul className="ml-1 list-inside list-disc space-y-1 text-amber-100/90">
                  <li>You have <b>{quiz.timeLimit} minutes</b> — the quiz submits automatically when time runs out.</li>
                  <li><b>Do not switch tabs or leave this window.</b> Doing so submits your quiz instantly.</li>
                  <li>{quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} · pass mark {quiz.passingScore}%.</li>
                  <li>You get <b>one attempt</b> only.</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setPhase("closed")}>Cancel</Button>
                <Button onClick={() => setPhase("taking")}>Start Quiz</Button>
              </div>
            </div>
          )}

          {phase === "taking" && (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <div>
                  <p className="font-semibold text-zinc-100">{quiz.title}</p>
                  <p className="text-xs text-amber-400/80">Leaving this tab submits your quiz.</p>
                </div>
                <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${lowTime ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-200"}`}>
                  <Clock className="h-4 w-4" /> {mm}:{ss}
                </div>
              </div>
              <div className="space-y-5 overflow-y-auto p-5">
                {quiz.questions.map((q, qi) => (
                  <div key={qi} className="space-y-2">
                    <p className="font-medium text-zinc-100">{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${answers[qi] === oi ? "border-violet-500/60 bg-violet-500/10 text-zinc-100" : "border-zinc-800 text-zinc-300 hover:border-zinc-700"}`}>
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            checked={answers[qi] === oi}
                            onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                            className="h-4 w-4 accent-violet-500"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 p-4">
                <span className="text-xs text-zinc-500">{answers.filter((a) => a >= 0).length}/{quiz.questions.length} answered</span>
                <Button onClick={() => submit("completed")}>Submit Quiz</Button>
              </div>
            </>
          )}

          {phase === "result" && result && (
            <div className="space-y-4 p-6 text-center">
              {result.passed ? (
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
              ) : (
                <XCircle className="mx-auto h-14 w-14 text-red-400" />
              )}
              <div>
                <p className="text-2xl font-bold text-zinc-100">{result.score}/{result.total} correct</p>
                <p className={`mt-1 font-semibold ${result.passed ? "text-emerald-400" : "text-red-400"}`}>
                  {result.passed ? "Passed" : "Not passed"}
                </p>
              </div>
              {result.reason === "tab_switch" && (
                <p className="text-sm text-amber-400">Auto-submitted because you left the quiz tab.</p>
              )}
              {result.reason === "timeout" && (
                <p className="text-sm text-amber-400">Auto-submitted because time ran out.</p>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={() => setPhase("closed")}>Done</Button>
            </div>
          )}
        </div>
      </div>
    );

  return (
    <>
      <Button size="sm" onClick={openIntro}>Start Quiz</Button>
      {mounted && overlay && createPortal(overlay, document.body)}
    </>
  );
}
