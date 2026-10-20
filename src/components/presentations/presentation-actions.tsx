"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { BatchSelect } from "@/components/shared/batch-select";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Users, User } from "lucide-react";

type Student = { id: string; name: string; email: string };

export type GroupData = {
  id: string;
  name: string;
  topic: string | null;
  notes: string | null;
  members: Student[];
};

type RoundForm = {
  id?: string;
  title: string;
  description: string;
  mode: string;
  batchId: string;
  scheduledAt: string;
};

function RoundModal({
  open,
  onClose,
  initial,
  mode,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  initial: RoundForm;
  mode: "create" | "edit";
  /** Lets the caller carry straight on into forming the first group. */
  onCreated?: (round: { id: string; mode: string }) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RoundForm>(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/presentations", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    onClose();
    router.refresh();
    if (mode === "create" && data.presentation) {
      onCreated?.({ id: data.presentation.id, mode: data.presentation.mode ?? form.mode });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New presentation round" : "Edit presentation"}
      description={mode === "create" ? "Hand out topics to groups or to individuals" : form.title}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Week 5 Presentations"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What students should prepare, how long each slot is…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Topics given to</Label>
            <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              <option value="group">Groups</option>
              <option value="individual">Each student</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>
        </div>

        <BatchSelect value={form.batchId} onChange={(batchId) => setForm({ ...form, batchId })} />

        <p className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunk)] p-3 text-xs text-zinc-400">
          {form.mode === "group"
            ? "Next you'll pick which students go in each group and give every group its topic."
            : "Next you'll pick each student and give them their topic."}
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CreatePresentationButton({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false);
  // Creating a round and filling it is one job, so the second step opens itself.
  const [building, setBuilding] = useState<{ id: string; mode: string } | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Presentation
      </Button>
      {open && (
        <RoundModal
          open={open}
          onClose={() => setOpen(false)}
          mode="create"
          initial={{ title: "", description: "", mode: "group", batchId: "", scheduledAt: "" }}
          onCreated={(round) => setBuilding(round)}
        />
      )}
      {building && (
        <GroupModal
          presentationId={building.id}
          mode={building.mode}
          students={students}
          open={Boolean(building)}
          onClose={() => setBuilding(null)}
        />
      )}
    </>
  );
}

export function EditPresentationButton({ round }: { round: RoundForm }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="Edit presentation">
        <Pencil className="h-4 w-4" />
      </Button>
      {open && <RoundModal open={open} onClose={() => setOpen(false)} mode="edit" initial={round} />}
    </>
  );
}

export function DeletePresentationButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/presentations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy(false);
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
        aria-label="Delete presentation"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete presentation" description={title}>
        <div className="space-y-4 text-sm">
          <p className="text-zinc-400">
            This removes the round and every group in it. Student accounts are untouched.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={remove} disabled={busy} className="bg-red-600 hover:bg-red-500">
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * Creates or edits one slot: its topic and who presents it.
 *
 * An individual round still uses this, with the student picker limited to one
 * choice — the two modes differ only in how many people a slot holds.
 */
export function GroupModal({
  presentationId,
  mode,
  students,
  group,
  taken,
  open,
  onClose,
}: {
  presentationId: string;
  mode: string;
  students: Student[];
  group?: GroupData;
  /** studentId → the group they are already in, for this round. */
  taken?: Record<string, string>;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const isIndividual = mode === "individual";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(group?.name ?? "");
  const [topic, setTopic] = useState(group?.topic ?? "");
  const [picked, setPicked] = useState<string[]>(group?.members.map((m) => m.id) ?? []);

  function toggle(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return isIndividual ? [id] : [...current, id];
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    const chosen = students.find((s) => s.id === picked[0]);
    const res = await fetch("/api/presentations/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: group?.id,
        presentationId,
        // An individual slot is named after whoever presents it.
        name: isIndividual ? (chosen?.name ?? (name || "Unassigned")) : name,
        topic,
        studentIds: picked,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={group ? "Edit group" : isIndividual ? "Assign a topic" : "Form a group"}
      description={
        isIndividual
          ? "Pick the student, then give them a topic"
          : "Pick who is in the group, then give the group its topic"
      }
    >
      <div className="space-y-4">
        {/* Step 1 — who presents. This is the part that forms the group the
            students will see in their portal. */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label>{isIndividual ? "1 · Student" : `1 · Members`}</Label>
            {!isIndividual && (
              <span className="text-xs text-zinc-500">{picked.length} selected</span>
            )}
          </div>

          {students.length === 0 ? (
            <p className="rounded-lg border border-[var(--line)] p-4 text-sm text-zinc-500">
              No students in this batch yet.
            </p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
              {students.map((s) => {
                const on = picked.includes(s.id);
                const takenBy = taken?.[s.id];
                const unavailable = Boolean(takenBy) && !on;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                      on
                        ? "border-[var(--accent)] bg-[var(--accent-quiet)]"
                        : unavailable
                          ? "cursor-not-allowed border-[var(--line)] opacity-50"
                          : "border-[var(--line)] hover:bg-[var(--surface-sunk)]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                        on
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                          : "border-[var(--line-strong)] text-transparent"
                      )}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-zinc-200">{s.name}</span>
                      <span className="block truncate text-[11px] text-zinc-500">
                        {/* Say where a student already is, rather than just greying them out. */}
                        {unavailable ? `Already in ${takenBy}` : s.email}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!isIndividual && (
          <div className="space-y-2">
            <Label>2 · Group name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group A" />
          </div>
        )}

        {/* Step 2/3 — the topic this group presents. */}
        <div className="space-y-2">
          <Label>{isIndividual ? "2 · Topic" : "3 · Topic"}</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Building a WhatsApp support bot"
          />
          <p className="text-xs text-zinc-500">
            This is what {isIndividual ? "the student sees" : "the group sees"} in their portal.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={busy || picked.length === 0}>
            {busy ? "Saving…" : group ? "Save" : isIndividual ? "Assign topic" : "Create group"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function GroupManager({
  presentationId,
  mode,
  students,
  groups,
}: {
  presentationId: string;
  mode: string;
  students: Student[];
  groups: GroupData[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<GroupData | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const isIndividual = mode === "individual";

  // Which group each student is already in, so the picker can say so instead
  // of silently letting you double-book someone.
  const taken: Record<string, string> = {};
  for (const g of groups) for (const m of g.members) taken[m.id] = g.name;
  const unplaced = students.filter((s) => !taken[s.id]);

  async function removeGroup(id: string) {
    await fetch(`/api/presentations/groups?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {isIndividual ? "Topics" : "Groups"} ({groups.length})
        </p>
        <Button
          size="sm"
          variant="secondary"
          disabled={unplaced.length === 0}
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> {isIndividual ? "Assign topic" : "Add group"}
        </Button>
      </div>

      {unplaced.length > 0 ? (
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-amber-500">{unplaced.length}</span> still to place:{" "}
          {unplaced.map((s) => s.name).join(", ")}
        </p>
      ) : (
        students.length > 0 && (
          <p className="text-xs text-emerald-500">Everyone has been placed.</p>
        )
      )}

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--line)] p-6 text-center text-sm text-zinc-500">
          Nothing assigned yet.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border border-[var(--line)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                    {isIndividual ? <User className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                    {g.name}
                  </p>
                  {g.topic ? (
                    <p className="mt-0.5 text-sm text-[var(--accent)]">{g.topic}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-amber-500">No topic set</p>
                  )}
                  {!isIndividual && (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {g.members.map((m) => m.name).join(", ") || "No members"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing(g);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-red-500"
                    aria-label="Remove"
                    onClick={() => removeGroup(g.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <GroupModal
          presentationId={presentationId}
          mode={mode}
          students={students}
          group={editing}
          taken={taken}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
