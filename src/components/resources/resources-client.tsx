"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { FileText, Video, Link2, GitBranch, Download, Sparkles, Plus } from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  videos: Video,
  pdfs: FileText,
  slides: FileText,
  templates: FileText,
  github: GitBranch,
  links: Link2,
  prompts: Sparkles,
  cheatsheets: FileText,
  automation: Sparkles,
};

const CATEGORIES = ["videos", "pdfs", "slides", "templates", "github", "links", "prompts", "cheatsheets", "automation"];

type Resource = {
  id: string;
  title: string;
  category: string;
  url: string;
  fileType?: string | null;
};

export function ResourcesClient({ resources, canAdd }: { resources: Resource[]; canAdd: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: "links", url: "", description: "" });

  const filtered = useMemo(
    () => (filter === "all" ? resources : resources.filter((r) => r.category === filter)),
    [filter, resources]
  );

  function download(resource: Resource) {
    if (!resource.url || resource.url === "#") {
      alert("No file URL is attached to this resource yet.");
      return;
    }
    window.open(resource.url, "_blank", "noopener,noreferrer");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add resource");
      return;
    }
    setOpen(false);
    setForm({ title: "", category: "links", url: "", description: "" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Resources</h2>
          <p className="text-zinc-400">Videos, PDFs, templates, prompts, and more</p>
        </div>
        {canAdd && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}>
            <Badge
              variant={cat === filter ? "info" : "default"}
              className={`cursor-pointer capitalize ${cat === filter ? "ring-1 ring-violet-500/50" : ""}`}
            >
              {cat}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((resource) => {
          const Icon = categoryIcons[resource.category] ?? FileText;
          return (
            <Card key={resource.id} className="hover:border-violet-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    <Icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-zinc-100">{resource.title}</h3>
                    <Badge className="mt-2 capitalize">{resource.category}</Badge>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => download(resource)}>
                  <Download className="h-4 w-4" /> Open
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-zinc-500">No resources in this category yet.</p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Resource" description="Share a link, file, or template">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add Resource"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
