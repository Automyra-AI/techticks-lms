import { getResources } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Video, Link2, GitBranch, Download, Sparkles } from "lucide-react";

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

export default async function ResourcesPage() {
  const allResources = await getResources();

  const categories = ["all", "videos", "pdfs", "slides", "templates", "github", "links", "prompts", "cheatsheets", "automation"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Resources</h2>
        <p className="text-zinc-400">Videos, PDFs, templates, prompts, and more</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge key={cat} variant={cat === "all" ? "info" : "default"} className="cursor-pointer capitalize">
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allResources.map((resource) => {
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
                <Button variant="secondary" size="sm" className="mt-4 w-full">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
