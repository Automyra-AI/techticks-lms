"use client";

import { Bell, Bot, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function SettingsPage() {
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue="Hamza Khan" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="student@techticks.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input defaultValue="https://github.com/hamzakhan" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input defaultValue="https://linkedin.com/in/hamzakhan" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Assignment Due Reminders", "Session Reminders", "Grade Notifications", "New Resources"].map(
              (item) => (
                <label key={item} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <span className="text-sm text-zinc-300">{item}</span>
                  <input type="checkbox" defaultChecked className="accent-violet-600" />
                </label>
              )
            )}
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
            {[
              "AI Assignment Reviewer",
              "AI Feedback Generator",
              "AI Quiz Generator",
              "AI Code Review",
              "AI Course Assistant",
            ].map((feature) => (
              <div key={feature} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
                <span className="text-sm text-zinc-300">{feature}</span>
                <BadgeComingSoon />
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <Button variant="secondary">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BadgeComingSoon() {
  return (
    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-400">Coming Soon</span>
  );
}
