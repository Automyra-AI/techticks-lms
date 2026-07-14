"use client";

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
}: {
  node: RoadmapNodeData | null;
  onClose: () => void;
}) {
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
            <Button variant="secondary" className="justify-start">
              <FileText className="h-4 w-4" /> View Notes
            </Button>
            <Button variant="secondary" className="justify-start">
              <ExternalLink className="h-4 w-4" /> Watch Video
            </Button>
            <Button variant="secondary" className="justify-start">
              <GitBranch className="h-4 w-4" /> GitHub Repository
            </Button>
          </div>
        </div>

        {node.status !== "completed" && node.status !== "locked" && (
          <Button className="w-full">Mark as Complete</Button>
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
          {assignment.marks !== undefined && (
            <span className="text-violet-400">Score: {assignment.marks}/{assignment.maxMarks}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
