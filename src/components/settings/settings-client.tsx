"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bot, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Profile = {
  name: string;
  email: string;
  github: string;
  linkedin: string;
  phone: string;
};

export function SettingsClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    "Assignment Due Reminders": true,
    "Session Reminders": true,
    "Grade Notifications": true,
    "New Resources": true,
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setProfileBusy(false);
    setProfileMsg(res.ok ? "Profile saved!" : "Failed to save profile");
    if (res.ok) router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });
    const data = await res.json().catch(() => ({}));
    setPwBusy(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password updated!" });
      setPw({ currentPassword: "", newPassword: "" });
    } else {
      setPwMsg({ ok: false, text: data.error ?? "Failed to update password" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Settings</h2>
        <p className="text-zinc-400">Manage your profile and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>GitHub</Label>
                <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save Changes"}</Button>
                {profileMsg && <span className="text-sm text-emerald-400">{profileMsg}</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(notifs).map((item) => (
              <label key={item} className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 p-3">
                <span className="text-sm text-zinc-300">{item}</span>
                <input
                  type="checkbox"
                  checked={notifs[item]}
                  onChange={(e) => setNotifs({ ...notifs, [item]: e.target.checked })}
                  className="accent-violet-600"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" /> AI Features
            </CardTitle>
            <CardDescription>Configure AI-powered learning tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["AI Assignment Reviewer", "AI Feedback Generator", "AI Quiz Generator", "AI Code Review", "AI Course Assistant"].map((feature) => (
              <div key={feature} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
                <span className="text-sm text-zinc-300">{feature}</span>
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-400">Coming Soon</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" variant="secondary" disabled={pwBusy}>{pwBusy ? "Updating…" : "Update Password"}</Button>
                {pwMsg && <span className={`text-sm ${pwMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{pwMsg.text}</span>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
