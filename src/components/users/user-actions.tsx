"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Plus } from "lucide-react";

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
