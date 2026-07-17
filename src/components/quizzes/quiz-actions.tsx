"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Plus, Trash2, Pencil, X } from "lucide-react";

type QB = { question: string; options: string[]; correctIndex: number };

const blankQuestion = (): QB => ({ question: "", options: ["", ""], correctIndex: 0 });

function QuizForm({
  mode,
  initial,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: { id: string; title: string; timeLimit: number; passingScore: number; questions: QB[] };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [timeLimit, setTimeLimit] = useState(String(initial?.timeLimit ?? 10));
  const [passingScore, setPassingScore] = useState(String(initial?.passingScore ?? 70));
  const [questions, setQuestions] = useState<QB[]>(
    initial?.questions?.length ? initial.questions.map((q) => ({ ...q, options: [...q.options] })) : [blankQuestion()]
  );

  function update(qi: number, patch: Partial<QB>) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }
  function setOption(qi: number, oi: number, val: string) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q)));
  }
  function addOption(qi: number) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: [...q.options, ""] } : q)));
  }
  function removeOption(qi: number, oi: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        const correctIndex = q.correctIndex >= options.length ? options.length - 1 : q.correctIndex;
        return { ...q, options, correctIndex };
      })
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Client-side sanity check.
    for (const [i, q] of questions.entries()) {
      if (!q.question.trim()) return setError(`Question ${i + 1} needs text.`);
      if (q.options.some((o) => !o.trim())) return setError(`Question ${i + 1} has an empty option.`);
    }
    setBusy(true);
    const payload = {
      ...(mode === "edit" ? { id: initial!.id } : {}),
      title,
      timeLimit: Number(timeLimit),
      passingScore: Number(passingScore),
      questions,
    };
    const res = await fetch("/api/quizzes", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save quiz");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>Quiz Title</Label>
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 2 — n8n Basics Quiz" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Time Limit (minutes)</Label>
          <Input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Passing Score (%)</Label>
          <Input type="number" min="1" max="100" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Questions</Label>
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-400">Question {qi + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))} className="text-zinc-500 hover:text-red-400" aria-label="Remove question">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input value={q.question} onChange={(e) => update(qi, { question: e.target.value })} placeholder="What does an n8n trigger do?" />
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">Options — select the correct one:</p>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => update(qi, { correctIndex: oi })}
                    className="h-4 w-4 accent-violet-500"
                    aria-label={`Mark option ${oi + 1} correct`}
                  />
                  <Input value={opt} onChange={(e) => setOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                  {q.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(qi, oi)} className="text-zinc-600 hover:text-red-400" aria-label="Remove option">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addOption(qi)} className="text-xs text-violet-400 hover:text-violet-300">
                + Add option
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}>
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Create Quiz" : "Save Changes"}</Button>
      </div>
    </form>
  );
}

export function CreateQuizButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Quiz</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Quiz" description="Build a multiple-choice quiz">
        <QuizForm mode="create" onCancel={() => setOpen(false)} onDone={() => { setOpen(false); router.refresh(); }} />
      </Modal>
    </>
  );
}

export function EditQuizButton({ quiz }: { quiz: { id: string; title: string; timeLimit: number; passingScore: number; questions: QB[] } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100" title="Edit quiz" aria-label="Edit quiz" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit Quiz" description={quiz.title}>
        <QuizForm mode="edit" initial={quiz} onCancel={() => setOpen(false)} onDone={() => { setOpen(false); router.refresh(); }} />
      </Modal>
    </>
  );
}

export function DeleteQuizButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/quizzes?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete");
      return;
    }
    setOpen(false);
    router.refresh();
  }
  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" title="Delete quiz" aria-label="Delete quiz" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete Quiz" description={title}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">This deletes the quiz and all student attempts. This cannot be undone.</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={remove} disabled={busy} className="bg-red-600 hover:bg-red-500">{busy ? "Deleting…" : "Delete"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
