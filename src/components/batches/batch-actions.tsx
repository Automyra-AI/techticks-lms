"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";

type BatchForm = {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

function BatchFormModal({
  open,
  onClose,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial: BatchForm;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BatchForm>(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/batches", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save batch");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New batch" : "Edit batch"}
      description={mode === "create" ? "A cohort running through the course together" : form.name}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Batch name</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="AI Automation Batch 7"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Starts</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Ends</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create batch" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CreateBatchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Batch
      </Button>
      {open && (
        <BatchFormModal
          open={open}
          onClose={() => setOpen(false)}
          mode="create"
          initial={{ name: "", startDate: "", endDate: "", status: "active" }}
        />
      )}
    </>
  );
}

export function EditBatchButton({ batch }: { batch: BatchForm }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="Edit batch">
        <Pencil className="h-4 w-4" />
      </Button>
      {open && <BatchFormModal open={open} onClose={() => setOpen(false)} mode="edit" initial={batch} />}
    </>
  );
}

export function DeleteBatchButton({
  id,
  name,
  studentCount,
}: {
  id: string;
  name: string;
  studentCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/batches?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete batch");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-zinc-500 hover:text-red-500"
        onClick={() => setOpen(true)}
        aria-label="Delete batch"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete batch" description={name}>
        <div className="space-y-4 text-sm">
          <p className="text-zinc-400">
            {studentCount > 0
              ? `${studentCount} student${studentCount === 1 ? "" : "s"} will be unassigned — their accounts, submissions and grades are untouched.`
              : "No students are in this batch."}
          </p>
          <p className="text-zinc-500">
            Work scoped to this batch becomes visible to everyone again rather than disappearing.
          </p>
          {error && <p className="text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={remove} disabled={busy} className="bg-red-600 hover:bg-red-500">
              {busy ? "Deleting…" : "Delete batch"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
