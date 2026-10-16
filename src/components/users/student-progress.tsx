"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, CalendarCheck, HelpCircle, Award } from "lucide-react";
import { EditUserButton, DeleteUserButton, type BatchOption } from "@/components/users/user-actions";

export type StudentProgress = {
  id: string;
  name: string;
  email: string;
  role: string;
  batchId: string | null;
  batchName: string | null;
  phone: string | null;
  github: string | null;
  joined: string;
  totalAssignments: number;
  submitted: number;
  approved: number;
  pending: number;
  completion: number;
  averageScore: number | null;
  attendanceMarked: number;
  attendanceRate: number | null;
  quizzesTaken: number;
  quizzesPassed: number;
};

/** Green when on track, amber when slipping, red when barely started. */
function toneFor(pct: number) {
  if (pct >= 75) return "text-emerald-500";
  if (pct >= 40) return "text-amber-500";
  return "text-red-500";
}
function barFor(pct: number) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunk)] p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="font-display mt-1 text-xl font-bold tabular-nums text-zinc-100">{value}</p>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

/** One student, with their progress rate and the detail behind it on click. */
export function StudentProgressCard({
  student,
  batches,
  canDelete,
}: {
  student: StudentProgress;
  batches: BatchOption[];
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const s = student;
  // Managing the account happens on the card itself, so there is no second
  // table of the same people underneath.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-pop)]"
      >
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-ink)]">
              {s.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-100 transition-colors group-hover:text-[var(--accent)]">
                {s.name}
              </p>
              <p className="truncate text-xs text-zinc-500">{s.email}</p>
            </div>
            {s.batchName ? (
              <Badge variant="default">{s.batchName}</Badge>
            ) : (
              <Badge variant="warning">No batch</Badge>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-zinc-500">Coursework submitted</span>
              <span className={cn("font-display text-lg font-bold tabular-nums", toneFor(s.completion))}>
                {s.completion}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", barFor(s.completion))}
                style={{ width: `${Math.max(s.completion, 2)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {s.submitted} of {s.totalAssignments} assignments · {s.approved} approved
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
              <span>Avg {s.averageScore != null ? `${s.averageScore}%` : "—"}</span>
              <span>Attendance {s.attendanceRate != null ? `${s.attendanceRate}%` : "—"}</span>
              <span>
                Quizzes {s.quizzesPassed}/{s.quizzesTaken}
              </span>
            </div>
            <div className="flex shrink-0 items-center" onClick={stop}>
              <EditUserButton
                user={{
                  id: s.id,
                  name: s.name,
                  email: s.email,
                  role: s.role,
                  batchId: s.batchId,
                  phone: s.phone,
                  github: s.github,
                }}
                batches={batches}
              />
              {canDelete && (
                <DeleteUserButton user={{ id: s.id, name: s.name, email: s.email, role: s.role }} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={s.name} description={s.email}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {s.batchName ? <Badge variant="info">{s.batchName}</Badge> : <Badge variant="warning">No batch</Badge>}
            <span>Joined {formatDate(s.joined)}</span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-zinc-400">Overall progress</span>
              <span className={cn("font-display text-2xl font-bold tabular-nums", toneFor(s.completion))}>
                {s.completion}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
              <div
                className={cn("h-full rounded-full", barFor(s.completion))}
                style={{ width: `${Math.max(s.completion, 2)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={ClipboardCheck}
              label="Assignments"
              value={`${s.submitted}/${s.totalAssignments}`}
              hint={`${s.approved} approved · ${s.pending} awaiting review`}
            />
            <Stat
              icon={Award}
              label="Average score"
              value={s.averageScore != null ? `${s.averageScore}%` : "—"}
              hint={s.averageScore == null ? "nothing graded yet" : undefined}
            />
            <Stat
              icon={CalendarCheck}
              label="Attendance"
              value={s.attendanceRate != null ? `${s.attendanceRate}%` : "—"}
              hint={s.attendanceMarked ? `${s.attendanceMarked} sessions marked` : "no sessions marked"}
            />
            <Stat
              icon={HelpCircle}
              label="Quizzes"
              value={`${s.quizzesPassed}/${s.quizzesTaken}`}
              hint={s.quizzesTaken ? "passed / taken" : "none taken"}
            />
          </div>

          {s.github && (
            <a
              href={s.github}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[var(--accent)] hover:underline"
            >
              {s.github}
            </a>
          )}
        </div>
      </Modal>
    </>
  );
}
