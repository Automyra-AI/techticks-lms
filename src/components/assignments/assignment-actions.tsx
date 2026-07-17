"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Plus, Upload, Pencil, Trash2, Paperclip } from "lucide-react";

const MAX_FILE_MB = 3;

type AssignmentFormValues = {
  id?: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  maxMarks?: number | null;
  difficulty?: string | null;
  submissionFormat?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};

function readFileAsBase64(file: File): Promise<{ data: string; name: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // "data:<mime>;base64,<data>"
      resolve({ data: result.split(",")[1] ?? "", name: file.name, type: file.type || "application/octet-stream" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Shared create/edit form. On create it POSTs; on edit it PATCHes. */
function AssignmentForm({
  mode,
  initial,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: AssignmentFormValues;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<{ data: string; name: string; type: string } | null>(null);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    dueDate: initial?.dueDate ?? "",
    maxMarks: String(initial?.maxMarks ?? 100),
    difficulty: initial?.difficulty ?? "medium",
    submissionFormat: initial?.submissionFormat ?? "Google Drive Link",
    attachmentUrl: initial?.attachmentUrl ?? "",
  });

  const existingFileName = initial?.attachmentName ?? null;

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large. Max ${MAX_FILE_MB} MB — for bigger files, use a link instead.`);
      e.target.value = "";
      return;
    }
    setPickedFile(await readFileAsBase64(file));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      maxMarks: Number(form.maxMarks),
      difficulty: form.difficulty,
      submissionFormat: form.submissionFormat,
      attachmentUrl: form.attachmentUrl.trim(),
    };
    // A newly picked upload replaces any prior uploaded file, but the link
    // (attachmentUrl) is kept independently so an assignment can have both.
    if (pickedFile) {
      payload.attachmentData = pickedFile.data;
      payload.attachmentName = pickedFile.name;
      payload.attachmentType = pickedFile.type;
    }
    if (mode === "edit") payload.id = initial?.id;

    const res = await fetch("/api/assignments", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    onDone();
  }

  return (
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
          <Select value={form.submissionFormat} onChange={(e) => setForm({ ...form, submissionFormat: e.target.value })}>
            <option value="Google Drive Link">Google Drive Link</option>
            <option value="Google Drive Link + Notes">Google Drive Link + Notes</option>
            <option value="Notes / Text Only">Notes / Text Only</option>
          </Select>
        </div>
      </div>

      {/* Assignment file — upload a file and/or paste a link. Students open this. */}
      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Paperclip className="h-4 w-4" /> Assignment File (optional)
        </div>
        <div className="space-y-2">
          <Label>Upload a file (max {MAX_FILE_MB} MB)</Label>
          <input
            type="file"
            onChange={onFilePicked}
            className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500"
          />
          {pickedFile ? (
            <p className="text-xs text-emerald-400">Selected: {pickedFile.name}</p>
          ) : existingFileName ? (
            <p className="text-xs text-zinc-500">Current file: {existingFileName} (upload a new one to replace)</p>
          ) : null}
        </div>
        <div className="text-center text-xs text-zinc-600">— or —</div>
        <div className="space-y-2">
          <Label>File link (Drive / any URL)</Label>
          <Input
            type="url"
            value={form.attachmentUrl}
            onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
            placeholder="https://drive.google.com/…"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Create Assignment" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export function CreateAssignmentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create Assignment
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Assignment" description="Set up a new assignment for students">
        <AssignmentForm
          mode="create"
          onCancel={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}

export function EditAssignmentButton({ assignment }: { assignment: AssignmentFormValues }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
        title="Edit assignment"
        aria-label="Edit assignment"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit Assignment" description={assignment.title}>
        <AssignmentForm
          mode="edit"
          initial={assignment}
          onCancel={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}

export function DeleteAssignmentButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
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
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-red-400"
        title="Delete assignment"
        aria-label="Delete assignment"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete Assignment" description={title}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            This permanently deletes the assignment and all student submissions for it. This cannot be undone.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={remove} disabled={busy} className="bg-red-600 hover:bg-red-500">
              {busy ? "Deleting…" : "Delete Assignment"}
            </Button>
          </div>
        </div>
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
  const [pickedFile, setPickedFile] = useState<{ data: string; name: string; type: string } | null>(null);
  const [form, setForm] = useState({ driveUrl: "", content: "" });

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File is too large. Max ${MAX_FILE_MB} MB — for bigger files, share a Drive link instead.`);
      e.target.value = "";
      return;
    }
    setPickedFile(await readFileAsBase64(file));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickedFile && !form.driveUrl.trim() && !form.content.trim()) {
      setError("Upload a file, paste a Drive link, or add notes.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = { assignmentId, ...form };
    if (pickedFile) {
      payload.fileData = pickedFile.data;
      payload.fileName = pickedFile.name;
      payload.fileType = pickedFile.type;
    }
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      setForm({ driveUrl: "", content: "" });
      setPickedFile(null);
      router.refresh();
    }, 900);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Upload className="h-4 w-4" /> Submit Work
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Submit Assignment" description={title}>
        {done ? (
          <p className="py-6 text-center text-emerald-400">✓ Submitted for review!</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Upload your work (max {MAX_FILE_MB} MB)</Label>
              <input
                type="file"
                onChange={onFilePicked}
                className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500"
              />
              {pickedFile && <p className="text-xs text-emerald-400">Selected: {pickedFile.name}</p>}
              <p className="text-xs text-zinc-500">Uploading is the most reliable option — no sharing settings to get wrong.</p>
            </div>
            <div className="text-center text-xs text-zinc-600">— or —</div>
            <div className="space-y-2">
              <Label>Google Drive Link (optional)</Label>
              <Input type="url" value={form.driveUrl} onChange={(e) => setForm({ ...form, driveUrl: e.target.value })} placeholder="https://drive.google.com/file/d/…" />
              <p className="text-xs text-zinc-500">
                Open your file in Drive → Share → “Anyone with the link” → copy that link (not the “My Drive” address bar URL).
              </p>
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
