"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { Calendar, FileText, ExternalLink } from "lucide-react";
import {
  EditAssignmentButton,
  DeleteAssignmentButton,
  SubmitAssignmentButton,
} from "@/components/assignments/assignment-actions";

export type AssignmentItemData = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxMarks: number | null;
  difficulty: string | null;
  submissionFormat: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  hasFile: boolean;
};

export function AssignmentItem({
  assignment,
  role,
  submission,
}: {
  assignment: AssignmentItemData;
  role?: string;
  submission?: {
    status?: string | null;
    marks?: number | null;
    content?: string | null;
    driveUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
  };
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const isStaff = role === "admin" || role === "trainer";
  const isStudent = role === "student";
  // A student has a single submission per assignment; re-submitting edits it and
  // stamps updatedAt, which is what the "Updated" chip reflects.
  const submissionForm = submission
    ? { driveUrl: submission.driveUrl, content: submission.content, fileName: submission.fileName }
    : undefined;

  // An assignment can have an uploaded file AND an external link — show both.
  const uploadedUrl = assignment.hasFile ? `/api/assignments/file?id=${assignment.id}` : undefined;
  const uploadedLabel = assignment.attachmentName
    ? `View file: ${assignment.attachmentName}`
    : "View uploaded file";
  const linkUrl = assignment.attachmentUrl || undefined;
  const attachments = [
    uploadedUrl ? { url: uploadedUrl, label: uploadedLabel } : null,
    linkUrl ? { url: linkUrl, label: "Open link" } : null,
  ].filter(Boolean) as { url: string; label: string }[];

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const meta = (
    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
      {assignment.dueDate && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Due {formatDate(assignment.dueDate)}
        </span>
      )}
      <span>Max Marks: {assignment.maxMarks ?? 100}</span>
      <span className="capitalize">{assignment.difficulty ?? "medium"}</span>
      {assignment.submissionFormat && (
        <span className="flex items-center gap-1 text-zinc-400">
          <FileText className="h-3 w-3" /> Submit via: {assignment.submissionFormat}
        </span>
      )}
      {submission?.marks != null && (
        <span className="text-violet-400">Score: {submission.marks}/{assignment.maxMarks ?? 100}</span>
      )}
      {submission?.updatedAt ? (
        <span className="text-zinc-400">Updated {formatDate(submission.updatedAt)}</span>
      ) : submission?.submittedAt ? (
        <span className="text-zinc-400">Submitted {formatDate(submission.submittedAt)}</span>
      ) : null}
    </div>
  );

  const fileLinks = attachments.length > 0 && (
    <div className="flex flex-wrap items-center gap-4">
      {attachments.map((a) => (
        <a
          key={a.url}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stop}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          {a.label === "Open link" ? <ExternalLink className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          {a.label}
        </a>
      ))}
    </div>
  );

  return (
    <>
      <Card
        onClick={() => setDetailOpen(true)}
        className="cursor-pointer transition-colors hover:border-violet-500/40"
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-100">{assignment.title}</h3>
              {assignment.description && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{assignment.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1" onClick={stop}>
              {submission?.updatedAt && <Badge variant="info">Updated</Badge>}
              {submission?.status && <StatusBadge status={submission.status} />}
              {isStaff && (
                <>
                  <EditAssignmentButton assignment={assignment} />
                  <DeleteAssignmentButton id={assignment.id} title={assignment.title} />
                </>
              )}
            </div>
          </div>

          <div className="mt-4">{meta}</div>

          {(fileLinks || isStudent) && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>{fileLinks}</div>
              {isStudent && (
                <div onClick={stop}>
                  <SubmitAssignmentButton assignmentId={assignment.id} title={assignment.title} submission={submissionForm} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={assignment.title} description="Assignment details">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Instructions</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-300">
              {assignment.description?.trim() || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Due Date</p>
              <p className="text-zinc-200">{assignment.dueDate ? formatDate(assignment.dueDate) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Max Marks</p>
              <p className="text-zinc-200">{assignment.maxMarks ?? 100}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Difficulty</p>
              <p className="capitalize text-zinc-200">{assignment.difficulty ?? "medium"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Submission Format</p>
              <p className="text-zinc-200">{assignment.submissionFormat ?? "—"}</p>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/20"
                >
                  {a.label === "Open link" ? <ExternalLink className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  {a.label}
                </a>
              ))}
            </div>
          )}

          {isStudent && (submission?.driveUrl || submission?.fileUrl || submission?.content) && (
            <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
              <p className="text-xs text-zinc-500">
                Your submission {submission?.status ? `· ${submission.status}` : ""}
                {submission?.updatedAt
                  ? ` · updated ${formatDate(submission.updatedAt)}`
                  : submission?.submittedAt
                    ? ` · submitted ${formatDate(submission.submittedAt)}`
                    : ""}
              </p>
              {submission?.fileUrl && (
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-sky-400 hover:text-sky-300"
                >
                  <FileText className="h-3.5 w-3.5" /> {submission.fileName ? `Uploaded file: ${submission.fileName}` : "View uploaded file"}
                </a>
              )}
              {submission?.driveUrl && (
                <a
                  href={submission.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-violet-400 hover:text-violet-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View submitted Drive link
                </a>
              )}
              {submission?.content && (
                <p className="whitespace-pre-wrap text-zinc-400">{submission.content}</p>
              )}
            </div>
          )}

          {isStudent && (
            <div className="flex justify-end pt-2">
              <SubmitAssignmentButton assignmentId={assignment.id} title={assignment.title} submission={submissionForm} />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
