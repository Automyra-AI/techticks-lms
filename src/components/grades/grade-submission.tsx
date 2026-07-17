"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { GraduationCap, ExternalLink } from "lucide-react";

const STATUSES = [
  { value: "approved", label: "Approved" },
  { value: "revision_needed", label: "Revision Needed" },
  { value: "rejected", label: "Rejected" },
  { value: "late", label: "Late" },
  { value: "pending", label: "Pending" },
];

export function GradeSubmission({
  submission,
}: {
  submission: {
    id: string;
    assignmentTitle: string;
    studentName: string;
    maxMarks: number;
    driveUrl: string | null;
    githubUrl: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    content: string | null;
    status: string | null;
    marks: number | null;
    feedback: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    marks: submission.marks != null ? String(submission.marks) : "",
    status: submission.status && submission.status !== "pending" ? submission.status : "approved",
    feedback: submission.feedback ?? "",
  });

  const isGraded = submission.status && submission.status !== "pending";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const marks = form.marks === "" ? null : Number(form.marks);
    if (marks != null && (marks < 0 || marks > submission.maxMarks)) {
      setBusy(false);
      setError(`Marks must be between 0 and ${submission.maxMarks}.`);
      return;
    }
    const res = await fetch("/api/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: submission.id, marks, status: form.status, feedback: form.feedback }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save grade");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <GraduationCap className="h-4 w-4" /> {isGraded ? "Update Grade" : "Grade"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grade Submission"
        description={`${submission.studentName} · ${submission.assignmentTitle}`}
      >
        <form onSubmit={save} className="space-y-4">
          {(submission.fileUrl || submission.driveUrl || submission.githubUrl || submission.content) && (
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Submitted work</p>
              {submission.fileUrl && (
                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300">
                  <ExternalLink className="h-3.5 w-3.5" /> {submission.fileName ? `Uploaded file: ${submission.fileName}` : "Uploaded file"}
                </a>
              )}
              {submission.driveUrl && (
                <a href={submission.driveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300">
                  <ExternalLink className="h-3.5 w-3.5" /> Drive link
                </a>
              )}
              {submission.githubUrl && (
                <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300">
                  <ExternalLink className="h-3.5 w-3.5" /> GitHub link
                </a>
              )}
              {submission.content && <p className="text-sm text-zinc-400">“{submission.content}”</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marks (out of {submission.maxMarks})</Label>
              <Input
                type="number"
                min="0"
                max={submission.maxMarks}
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="What was good, what to improve…" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Grade"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
