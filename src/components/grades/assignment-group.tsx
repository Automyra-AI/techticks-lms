"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { GradeSubmission } from "@/components/grades/grade-submission";
import { formatDate } from "@/lib/utils";
import { ChevronRight, Users } from "lucide-react";

export type GradingRow = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  studentEmail: string;
  maxMarks: number;
  driveUrl: string | null;
  githubUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  content: string | null;
  status: string | null;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  updatedAt: string | null;
};

const isPending = (r: GradingRow) => r.status === "pending" || r.status === "revision_needed";

/**
 * One card per assignment, holding every student's submission for it. The flat
 * list repeated the assignment title on every row, so a class of 10 submitting
 * 3 assignments produced 30 rows with no grouping.
 */
export function AssignmentGroupCard({
  title,
  rows,
}: {
  title: string;
  rows: GradingRow[];
}) {
  const [open, setOpen] = useState(false);

  const pending = rows.filter(isPending).length;
  const graded = rows.filter((r) => r.marks != null).length;
  const maxMarks = rows[0]?.maxMarks ?? 100;
  const scored = rows.filter((r) => r.marks != null);
  const average = scored.length
    ? Math.round(scored.reduce((sum, r) => sum + (r.marks ?? 0), 0) / scored.length)
    : null;
  const latest = rows
    .map((r) => r.updatedAt ?? r.submittedAt)
    .sort()
    .at(-1);

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="cursor-pointer transition-colors hover:border-violet-500/40"
      >
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-100">{title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {rows.length} submission{rows.length === 1 ? "" : "s"}
              </span>
              {average != null && (
                <span className="text-violet-400">Average {average}/{maxMarks}</span>
              )}
              {latest && <span>Last activity {formatDate(latest)}</span>}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {pending > 0 ? (
              <Badge variant="warning">{pending} to review</Badge>
            ) : (
              <Badge variant="success">All reviewed</Badge>
            )}
            <span className="text-xs text-zinc-500">{graded}/{rows.length} graded</span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </div>
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={`${rows.length} submission${rows.length === 1 ? "" : "s"}${pending ? ` · ${pending} to review` : ""}`}
        className="max-w-3xl"
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {rows.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-800 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-200">{sub.studentName}</p>
                <p className="text-xs text-zinc-500">
                  {sub.studentEmail}
                  {sub.submittedAt ? ` · submitted ${formatDate(sub.submittedAt)}` : ""}
                  {sub.updatedAt ? ` · updated ${formatDate(sub.updatedAt)}` : ""}
                </p>
                {sub.feedback && (
                  <p className="mt-1 text-xs text-zinc-500">Feedback: {sub.feedback}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {sub.updatedAt && <Badge variant="info">Updated</Badge>}
                <StatusBadge status={sub.status ?? "pending"} />
                <span className="text-sm font-bold text-violet-400">
                  {sub.marks ?? "—"}/{sub.maxMarks}
                </span>
                <GradeSubmission submission={sub} />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
