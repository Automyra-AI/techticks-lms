import { getSession } from "@/lib/auth";
import { getPresentations, getUserBatchId, getStudentsForBatch } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, User, CalendarDays, Presentation as PresentationIcon } from "lucide-react";
import {
  CreatePresentationButton,
  EditPresentationButton,
  DeletePresentationButton,
  GroupManager,
} from "@/components/presentations/presentation-actions";

export default async function PresentationsPage() {
  const session = await getSession();
  if (!session) return null;

  const isStaff = session.role === "admin" || session.role === "trainer";
  const batchId = await getUserBatchId(session.id);

  const rounds = await getPresentations(
    isStaff ? undefined : { id: session.id, batchId }
  );

  // A new round has no batch chosen yet, so the create flow offers everyone.
  const allStudents = isStaff ? await getStudentsForBatch(null) : [];

  // Staff need the eligible roster per round to fill groups from.
  const rosters = isStaff
    ? Object.fromEntries(
        await Promise.all(
          rounds.map(async (r) => [r.id, await getStudentsForBatch(r.batchId)] as const)
        )
      )
    : {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-400">
          {isStaff
            ? "Assign presentation topics to groups or to individual students"
            : "Your presentation topics and who you are presenting with"}
        </p>
        {isStaff && <CreatePresentationButton students={allStudents} />}
      </div>

      {rounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-zinc-500">
          {isStaff
            ? "No presentations yet. Create one to hand out topics."
            : "No presentations have been assigned to you yet."}
        </p>
      ) : (
        <div className={isStaff ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
          {rounds.map((round) => (
            <Card key={round.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-100">{round.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        {round.mode === "individual" ? (
                          <>
                            <User className="h-3 w-3" /> Individual topics
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3" /> Group topics
                          </>
                        )}
                      </span>
                      {round.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatDate(round.scheduledAt)}
                        </span>
                      )}
                      {isStaff && (
                        <span>
                          {round.groups.length} assigned · {round.unassigned.length} unassigned
                        </span>
                      )}
                    </p>
                    {round.description && (
                      <p className="mt-2 text-sm text-zinc-400">{round.description}</p>
                    )}
                  </div>

                  {isStaff && (
                    <div className="flex shrink-0 items-center">
                      <EditPresentationButton
                        round={{
                          id: round.id,
                          title: round.title,
                          description: round.description ?? "",
                          mode: round.mode,
                          batchId: round.batchId ?? "",
                          scheduledAt: round.scheduledAt ?? "",
                        }}
                      />
                      <DeletePresentationButton id={round.id} title={round.title} />
                    </div>
                  )}
                </div>

                {isStaff ? (
                  <>
                    <GroupManager
                      presentationId={round.id}
                      mode={round.mode}
                      students={rosters[round.id] ?? []}
                      groups={round.groups}
                    />
                    {round.unassigned.length > 0 && (
                      <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-xs text-amber-500">
                        Not yet assigned: {round.unassigned.map((s) => s.name).join(", ")}
                      </p>
                    )}
                  </>
                ) : round.mine ? (
                  <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-quiet)] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      <PresentationIcon className="h-3.5 w-3.5" /> Your topic
                    </p>
                    <p className="font-display mt-1.5 text-lg font-bold text-zinc-100">
                      {round.mine.topic ?? "Topic to be announced"}
                    </p>
                    {round.mode === "group" && (
                      <p className="mt-2 text-sm text-zinc-400">
                        <span className="font-medium text-zinc-300">{round.mine.name}</span> ·{" "}
                        {round.mine.members.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <Badge variant="warning">You haven&apos;t been assigned a topic yet</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
