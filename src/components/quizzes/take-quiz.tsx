"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle2, XCircle, PartyPopper } from "lucide-react";
import { Confetti } from "@/components/quizzes/confetti";

type Q = { question: string; options: string[] };
export type ReviewItem = {
  question: string;
  options: string[];
  correctIndex: number;
  chosenIndex: number;
  correct: boolean;
};
type Result = { score: number; total: number; percent: number; passed: boolean; reason: string; passingScore: number };

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
  const [review, setReview] = useState<ReviewItem[] | null>(null);
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
      if (data.attempt) setResult({ ...data.attempt, percent: 0, passingScore: quiz.passingScore, reason });
      setPhase("result");
      return;
    }
    setResult({
      score: data.score,
      total: data.total,
      percent: data.percent,
      passed: data.passed,
      passingScore: data.passingScore ?? quiz.passingScore,
      reason,
    });
    setReview(Array.isArray(data.review) ? data.review : null);
    setPhase("result");
    // No router.refresh() here: the refresh re-renders the quizzes page, which
    // swaps this component out for the score badge as soon as an attempt
    // exists — closing the result screen (and the confetti) immediately.
    // It runs on dismiss instead, in closeResult().
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

  /** Closes the result and brings the quizzes page up to date with the attempt. */
  function closeResult() {
    setPhase("closed");
    router.refresh();
  }

  function openIntro() {
    setAnswers(quiz.questions.map(() => -1));
    setSecondsLeft(quiz.timeLimit * 60);
    setResult(null);
    setError(null);
    submittingRef.current = false;
    setPhase("intro");
  }

  const answeredCount = answers.filter((a) => a >= 0).length;
  const unanswered = quiz.questions.length - answeredCount;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft <= 60;

  const overlay =
    phase === "closed" ? null : (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--n-50)]/70 p-4 backdrop-blur-sm">
        {phase === "result" && result?.passed && <Confetti />}
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
              <div className="border-b border-zinc-800 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-100">{quiz.title}</p>
                    <p className="text-xs text-amber-400/80">Leaving this tab submits your quiz.</p>
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${
                      lowTime ? "animate-pulse bg-red-500/15 text-red-500" : "bg-[var(--surface-sunk)] text-zinc-200"
                    }`}
                  >
                    <Clock className="h-4 w-4" /> {mm}:{ss}
                  </div>
                </div>

                {/* How far through you are, so the list does not feel endless. */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                      style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium text-zinc-500">
                    {answeredCount}/{quiz.questions.length} answered
                  </span>
                </div>
              </div>
              <div className="space-y-5 overflow-y-auto p-5">
                {quiz.questions.map((q, qi) => {
                  const answered = answers[qi] >= 0;
                  return (
                    <div
                      key={qi}
                      className="rounded-xl border border-zinc-800 bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            answered
                              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                              : "bg-[var(--surface-sunk)] text-zinc-500"
                          }`}
                        >
                          {qi + 1}
                        </span>
                        <p className="font-medium text-zinc-100">{q.question}</p>
                      </div>

                      <div className="mt-3 space-y-2 pl-9">
                        {q.options.map((opt, oi) => {
                          const picked = answers[qi] === oi;
                          return (
                            <label
                              key={oi}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                                picked
                                  ? "border-[var(--accent)] bg-[var(--accent-quiet)] text-zinc-100"
                                  : "border-zinc-800 text-zinc-300 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-sunk)]"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                checked={picked}
                                onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                                className="sr-only"
                              />
                              {/* Lettered chip instead of a native radio — bigger target, clearer state. */}
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                                  picked
                                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                                    : "border-zinc-700 text-zinc-500"
                                }`}
                              >
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-zinc-800 p-4">
                <span className="text-xs text-zinc-500">
                  {unanswered > 0
                    ? `${unanswered} question${unanswered === 1 ? "" : "s"} left unanswered`
                    : "All questions answered"}
                </span>
                <Button onClick={() => submit("completed")}>Submit Quiz</Button>
              </div>
            </>
          )}

          {phase === "result" && result && (
            <div className="space-y-4 overflow-y-auto p-6 text-center">
              <div className="flex items-center justify-center gap-4">
                <Image
                  src={result.passed ? "/streak-happy.webp" : "/streak-sad.webp"}
                  alt=""
                  width={96}
                  height={72}
                  className="h-auto w-[84px] drop-shadow-md"
                />
                <ScoreRing percent={result.percent} passed={result.passed} />
              </div>

              {result.passed ? (
                <div className="space-y-1">
                  <p className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-500">
                    <PartyPopper className="h-6 w-6" /> Congratulations!
                  </p>
                  <p className="text-sm text-zinc-400">
                    You passed with {result.score} of {result.total} correct.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="flex items-center justify-center gap-2 text-2xl font-bold text-zinc-100">
                    <XCircle className="h-6 w-6 text-red-500" /> Not passed
                  </p>
                  <p className="text-sm text-zinc-400">
                    {result.score} of {result.total} correct — {result.passingScore}% was needed. Review the
                    answers below.
                  </p>
                </div>
              )}
              {result.reason === "tab_switch" && (
                <p className="text-sm text-amber-400">Auto-submitted because you left the quiz tab.</p>
              )}
              {result.reason === "timeout" && (
                <p className="text-sm text-amber-400">Auto-submitted because time ran out.</p>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}

              {review && <QuizReview review={review} />}

              <Button onClick={closeResult}>Done</Button>
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

/** Per-question breakdown shown after the attempt: what you picked vs the answer. */
export function QuizReview({ review }: { review: ReviewItem[] }) {
  return (
    <div className="space-y-3 text-left">
      <p className="text-sm font-semibold text-zinc-300">
        Answers — {review.filter((r) => r.correct).length} of {review.length} correct
      </p>
      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {review.map((r, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${
              r.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-start gap-2">
              {r.correct ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              )}
              <p className="text-sm font-medium text-zinc-200">
                {i + 1}. {r.question}
              </p>
            </div>
            <ul className="mt-2 space-y-1 pl-6">
              {r.options.map((opt, oi) => {
                const isAnswer = oi === r.correctIndex;
                const isChoice = oi === r.chosenIndex;
                return (
                  <li
                    key={oi}
                    className={`text-xs ${
                      isAnswer ? "font-semibold text-emerald-400" : isChoice ? "text-red-400" : "text-zinc-500"
                    }`}
                  >
                    {opt}
                    {isAnswer && " — correct answer"}
                    {isChoice && !isAnswer && " — your answer"}
                  </li>
                );
              })}
              {r.chosenIndex < 0 && <li className="text-xs text-amber-400">You did not answer this question.</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Circular score readout — the headline number on the result screen. */
function ScoreRing({ percent, passed }: { percent: number; passed: boolean }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percent)) / 100;
  const stroke = passed ? "#10b981" : "#ef4444";

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-sunk)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - filled)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-zinc-100">{percent}%</span>
        {passed && <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />}
      </div>
    </div>
  );
}
