"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function CreateAnnouncementButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post announcement");
      return;
    }
    setOpen(false);
    setForm({ title: "", content: "" });
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Announcement
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New Announcement" description="Post an update to the course">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Week 4 starts Monday!" />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Details…" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
