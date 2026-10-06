"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Plus, Trash2, ClipboardCheck } from "lucide-react";

type Student = { id: string; name: string; email: string };
const STATUSES = ["present", "late", "absent", "excused"] as const;
/** Roster filters inside the Mark Attendance dialog. */
const FILTERS = ["all", ...STATUSES, "unmarked"] as const;
type Filter = (typeof FILTERS)[number];

export function CreateSessionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "90",
    meetingPlatform: "zoom",
    meetingUrl: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Combine date + optional time; a date with no time defaults to 00:00.
    const scheduledAt = form.date ? `${form.date}T${form.time || "00:00"}` : "";
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        scheduledAt,
        duration: Number(form.duration),
        meetingPlatform: form.meetingPlatform,
        meetingUrl: form.meetingUrl,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create session");
      return;
    }
    setOpen(false);
    setForm({ title: "", description: "", date: "", time: "", duration: "90", meetingPlatform: "zoom", meetingUrl: "" });
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create Session
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Session" description="Schedule a live session">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="n8n Introduction" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this session covers…" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Time (optional)</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" min="15" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })}>
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
                <option value="teams">Teams</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <Input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create Session"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function MarkAttendanceButton({
  sessionId,
  sessionTitle,
  students,
  existing,
}: {
  sessionId: string;
  sessionTitle: string;
  students: Student[];
  existing: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");

  function openModal() {
    // Start from whatever was already marked. Anyone unmarked stays blank — the
    // trainer picks each status deliberately, rather than everyone defaulting to
    // "present" and a stray Save marking the whole roster as attending.
    const seed: Record<string, string> = {};
    for (const s of students) seed[s.id] = existing[s.id] ?? "";
    setMarks(seed);
    setFilter("all");
    setError(null);
    setOpen(true);
  }

  // Students with a status chosen now, and students whose existing mark the
  // trainer has just blanked out (so a mis-marked session can be undone).
  const chosen = students.filter((s) => marks[s.id]);
  const cleared = students.filter((s) => !marks[s.id] && existing[s.id]);

  const matches = (s: Student, f: Filter) =>
    f === "all" ? true : f === "unmarked" ? !marks[s.id] : marks[s.id] === f;

  const visible = students.filter((s) => matches(s, filter));
  const countFor = (f: Filter) => students.filter((s) => matches(s, f)).length;

  /** Applies a status to the students currently shown, not the whole roster. */
  function setAllShown(status: string) {
    const next = { ...marks };
    for (const s of visible) next[s.id] = status;
    setMarks(next);
  }

  async function save() {
    if (chosen.length === 0 && cleared.length === 0) {
      setError("Choose a status for at least one student.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        records: chosen.map((s) => ({ studentId: s.id, status: marks[s.id] })),
        clear: cleared.map((s) => s.id),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save attendance");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openModal}>
        <ClipboardCheck className="h-4 w-4" /> Mark Attendance
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Mark Attendance" description={sessionTitle}>
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">No enrolled students to mark.</p>
        ) : (
          <div className="space-y-4">
            {/* Filter the roster by status — "Present" shows who is marked present. */}
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => {
                const n = countFor(f);
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-md border px-2 py-0.5 text-xs capitalize transition-colors ${
                      active
                        ? "border-violet-500/50 bg-violet-600/20 text-violet-300"
                        : "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {f} <span className={active ? "text-violet-400" : "text-zinc-600"}>{n}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
              <span className="text-xs text-zinc-500">
                {filter === "all" ? "Mark all:" : `Mark these ${visible.length}:`}
              </span>
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={visible.length === 0}
                  onClick={() => setAllShown(st)}
                  className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs capitalize text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                >
                  {st}
                </button>
              ))}
              <button
                type="button"
                disabled={visible.length === 0}
                onClick={() => setAllShown("")}
                className="rounded-md border border-zinc-800 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              {chosen.length} of {students.length} marked
              {cleared.length > 0 && ` · ${cleared.length} will be unmarked`}
              {chosen.length === 0 && cleared.length === 0 && " — nobody is marked yet"}
            </p>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {visible.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No students are marked {filter}.
                </p>
              )}
              {visible.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{s.name}</p>
                    <p className="truncate text-xs text-zinc-500">{s.email}</p>
                  </div>
                  <Select
                    className={`w-32 ${marks[s.id] ? "" : "text-zinc-500"}`}
                    value={marks[s.id] ?? ""}
                    onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    {STATUSES.map((st) => (
                      <option key={st} value={st} className="capitalize">
                        {st[0].toUpperCase() + st.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Attendance"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function DeleteSessionButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
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
      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" title="Delete session" aria-label="Delete session" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete Session" description={title}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">This deletes the session and its attendance records. This cannot be undone.</p>
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
