"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function CreateCourseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : 0,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create course");
      return;
    }
    setOpen(false);
    setForm({ title: "", description: "", price: "" });
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create Course
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Course" description="Add a new course to the academy">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AI Automation Mastery" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this course covers…" />
          </div>
          <div className="space-y-2">
            <Label>Price (USD)</Label>
            <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create Course"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
