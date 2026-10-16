"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Users, Check, Clock } from "lucide-react";

export type SubmissionStatus = {
  assignmentId: string;
  title: string;
  expected: number;
  submitted: {
    id: string;
    name: string;
    email: string;
    status: string | null;
    marks: number | null;
    submittedAt: string;
    updatedAt: string | null;
  }[];
  missing: { id: string; name: string; email: string }[];
  maxMarks: number;
};

/**
 * "9 of 15 submitted" on an assignment card, opening to the two lists a trainer
 * actually needs: who handed in, and who still has not.
 *
 * Only students in the assignment's batch are counted — the rest were never
 * shown it, so listing them as missing would be wrong.
 */
export function SubmissionStatusButton({ status }: { status: SubmissionStatus }) {
  const [open, setOpen] = useState(false);
  const done = status.submitted.length;
  const total = status.expected;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allIn = total > 0 && done === total;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-[var(--accent-quiet)] hover:text-[var(--accent)]"
        title="See who has submitted"
      >
        <Users className="h-3 w-3" />
        <span className={cn("tabular-nums", allIn && "text-emerald-500")}>
          {done}/{total}
        </span>
        submitted
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={status.title}
        description={`${done} of ${total} submitted`}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
            <div
              className={cn("h-full rounded-full", allIn ? "bg-emerald-500" : "bg-[var(--accent)]")}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                <Check className="h-3.5 w-3.5" /> Submitted ({done})
              </p>
              <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {status.submitted.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-500">Nobody has submitted yet.</p>
                ) : (
                  status.submitted.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunk)] p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-200">{s.name}</p>
                        <StatusBadge status={s.status ?? "pending"} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {formatDate(s.updatedAt ?? s.submittedAt)}
                        {s.marks != null && ` · ${s.marks}/${status.maxMarks}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
                <Clock className="h-3.5 w-3.5" /> Not submitted ({status.missing.length})
              </p>
              <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {status.missing.length === 0 ? (
                  <p className="py-4 text-sm text-emerald-500">Everyone has handed in.</p>
                ) : (
                  status.missing.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5"
                    >
                      <p className="truncate text-sm font-medium text-zinc-200">{s.name}</p>
                      <p className="truncate text-[11px] text-zinc-500">{s.email}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {status.missing.length > 0 && (
            <Badge variant="warning">
              {status.missing.length} still to hand in
            </Badge>
          )}
        </div>
      </Modal>
    </>
  );
}
