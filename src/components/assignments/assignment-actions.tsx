"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Plus, Upload } from "lucide-react";

export function CreateAssignmentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxMarks: "100",
    difficulty: "medium",
    submissionFormat: "GitHub Link",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxMarks: Number(form.maxMarks) }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create assignment");
      return;
    }
    setOpen(false);
    setForm({ title: "", description: "", dueDate: "", maxMarks: "100", difficulty: "medium", submissionFormat: "GitHub Link" });
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create Assignment
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Assignment" description="Set up a new assignment for students">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="n8n Workflow Project" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Instructions…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <Input type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Submission Format</Label>
              <Input value={form.submissionFormat} onChange={(e) => setForm({ ...form, submissionFormat: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create Assignment"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SubmitAssignmentButton({
  assignmentId,
  title,
}: {
  assignmentId: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ githubUrl: "", driveUrl: "", content: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, ...form }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit");
      return;
    }
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setForm({ githubUrl: "", driveUrl: "", content: "" });
      router.refresh();
    }, 900);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" /> Submit Work
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Submit Assignment" description={title}>
        {done ? (
          <p className="py-6 text-center text-emerald-400">✓ Submitted for review!</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>GitHub Link</Label>
              <Input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/you/project" />
            </div>
            <div className="space-y-2">
              <Label>Drive / File Link (optional)</Label>
              <Input value={form.driveUrl} onChange={(e) => setForm({ ...form, driveUrl: e.target.value })} placeholder="https://drive.google.com/…" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Anything the reviewer should know…" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit"}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
