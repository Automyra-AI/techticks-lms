"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type UserForm = {
  id?: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  github: string;
  password?: string;
};

function UserFormModal({
  open,
  onClose,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial: UserForm;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save user");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add User" : "Edit User"}
      description={mode === "create" ? "Create a new account" : "Update account details"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>GitHub</Label>
          <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/…" />
        </div>
        {mode === "create" && (
          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <Input value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password123 (default)" />
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Add User" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add User
      </Button>
      {open && (
        <UserFormModal
          open={open}
          onClose={() => setOpen(false)}
          mode="create"
          initial={{ name: "", email: "", role: "student", phone: "", github: "", password: "" }}
        />
      )}
    </>
  );
}

export function EditUserButton({
  user,
}: {
  user: { id: string; name: string; email: string; role: string; phone?: string | null; github?: string | null };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      {open && (
        <UserFormModal
          open={open}
          onClose={() => setOpen(false)}
          mode="edit"
          initial={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone ?? "",
            github: user.github ?? "",
          }}
        />
      )}
    </>
  );
}

/**
 * Removes an account and its personal records. Courses, announcements and
 * weekly remarks the person authored are kept — the confirm text spells this
 * out, because it is the part an admin is most likely to worry about.
 */
export function DeleteUserButton({
  user,
}: {
  user: { id: string; name: string; email: string; role: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const isStaff = user.role === "admin" || user.role === "trainer";
  const canDelete = confirmText.trim().toLowerCase() === user.name.trim().toLowerCase();

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete user");
      return;
    }
    setOpen(false);
    setConfirmText("");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-zinc-500 hover:text-red-400"
        title={`Delete ${user.name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirmText("");
          setError(null);
        }}
        title="Delete user"
        description={`${user.name} · ${user.email}`}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            This permanently deletes the account and cannot be undone.
          </div>

          <div className="space-y-2 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">Deleted with them:</p>
            <ul className="list-inside list-disc space-y-0.5 text-zinc-500">
              <li>Their submissions and grades</li>
              <li>Attendance and roadmap progress</li>
              <li>Quiz attempts and certificates</li>
              <li>Enrollments and notifications</li>
            </ul>
            <p className="pt-1 font-medium text-zinc-300">Kept:</p>
            <ul className="list-inside list-disc space-y-0.5 text-zinc-500">
              {isStaff && <li>Courses they ran — left without a trainer, reassign them after</li>}
              {isStaff && <li>Announcements and weekly remarks — reassigned to you</li>}
              <li>Everything belonging to other students</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type <span className="font-semibold text-zinc-300">{user.name}</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.name}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={remove}
              disabled={busy || !canDelete}
              className="bg-red-600 hover:bg-red-500"
            >
              {busy ? "Deleting…" : "Delete user"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
