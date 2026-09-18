"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, FileText, GitBranch, ExternalLink } from "lucide-react";
import type { RoadmapNodeData } from "@/types";

export function NodeDetailPanel({
  node,
  onClose,
  canEdit = false,
}: {
  node: RoadmapNodeData | null;
  onClose: () => void;
  /** Staff edit the course roadmap itself; a student only records their own progress. */
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function openLink(url?: string, label?: string) {
    if (!url || url === "#") {
      alert(`No ${label ?? "resource"} attached to this topic yet.`);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function markComplete() {
    if (!node) return;
    setBusy(true);
    await fetch("/api/nodes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: node.id, status: "completed" }),
    });
    setBusy(false);
    router.refresh();
    onClose();
  }

  if (!node) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center p-6 text-zinc-500">
          Select a roadmap node to view details
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{node.title}</CardTitle>
            <div className="mt-2 flex gap-2">
              <StatusBadge status={node.status} />
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">
                {node.difficulty}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {node.description && (
          <p className="text-sm text-zinc-400">{node.description}</p>
        )}

        {node.duration && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="h-4 w-4" />
            Estimated: {node.duration}
          </div>
        )}

        {node.prerequisites && (
          <div>
            <h4 className="text-sm font-medium text-zinc-300">Prerequisites</h4>
            <p className="mt-1 text-sm text-zinc-500">{node.prerequisites}</p>
          </div>
        )}

        {node.completionPercent !== undefined && (
          <ProgressBar value={node.completionPercent} />
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-300">Resources</h4>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => openLink(node.notes ?? node.slidesUrl, "notes")}
            >
              <FileText className="h-4 w-4" /> View Notes
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => openLink(node.videoUrl, "video")}
            >
              <ExternalLink className="h-4 w-4" /> Watch Video
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => openLink(node.githubUrl, "GitHub repository")}
            >
              <GitBranch className="h-4 w-4" /> GitHub Repository
            </Button>
          </div>
        </div>

        {node.status !== "completed" && node.status !== "locked" && (
          <Button className="w-full" onClick={markComplete} disabled={busy}>
            {busy ? "Saving…" : canEdit ? "Mark as Complete for the Course" : "Mark as Complete"}
          </Button>
        )}
        {!canEdit && (
          <p className="text-center text-xs text-zinc-500">
            This tracks your own progress — the roadmap is managed by your trainer.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AssignmentCard({
  assignment,
}: {
  assignment: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    maxMarks: number;
    difficulty: string;
    status?: string;
    marks?: number;
    submissionFormat?: string;
    driveUrl?: string;
    fileUrl?: string;
    fileName?: string;
  };
}) {
  return (
    <Card className="hover:border-violet-500/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-zinc-100">{assignment.title}</h3>
            {assignment.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{assignment.description}</p>
            )}
          </div>
          {assignment.status && <StatusBadge status={assignment.status} />}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          {assignment.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due {formatDate(assignment.dueDate)}
            </span>
          )}
          <span>Max Marks: {assignment.maxMarks}</span>
          <span className="capitalize">{assignment.difficulty}</span>
          {assignment.submissionFormat && (
            <span className="flex items-center gap-1 text-zinc-400">
              <FileText className="h-3 w-3" />
              Submit via: {assignment.submissionFormat}
            </span>
          )}
          {assignment.marks !== undefined && (
            <span className="text-violet-400">Score: {assignment.marks}/{assignment.maxMarks}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              <FileText className="h-3.5 w-3.5" />
              {assignment.fileName ? `View file: ${assignment.fileName}` : "View assignment file"}
            </a>
          )}
          {assignment.driveUrl && (
            <a
              href={assignment.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View submitted Drive link
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
