"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";

export function CourseActions({
  course,
}: {
  course: { id: string; title: string; description: string | null; price: number | null };
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: course.title,
    description: course.description ?? "",
    price: String(course.price ?? 0),
  });

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: course.id,
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : 0,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update course");
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses?id=${course.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete course");
      return;
    }
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Course" description="Update course details">
        <form onSubmit={saveEdit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Price (USD)</Label>
            <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete Course" description={course.title}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            This permanently deletes the course and everything tied to it — roadmap, enrollments,
            assignments, submissions, sessions, and resources. This cannot be undone.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button type="button" onClick={remove} disabled={busy} className="bg-red-600 hover:bg-red-500">
              {busy ? "Deleting…" : "Delete Course"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
