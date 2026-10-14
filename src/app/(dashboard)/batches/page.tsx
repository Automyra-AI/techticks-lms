import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBatchesWithCounts, getUnassignedStudentCount, getUsers } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateBatchButton, EditBatchButton, DeleteBatchButton } from "@/components/batches/batch-actions";
import { formatDate } from "@/lib/utils";
import { Users, CalendarDays, AlertTriangle } from "lucide-react";

const statusVariant = {
  active: "success",
  upcoming: "info",
  completed: "default",
} as const;

export default async function BatchesPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";
  if (!isStaff) redirect("/dashboard");

  const [batchList, unassigned, students] = await Promise.all([
    getBatchesWithCounts(),
    getUnassignedStudentCount(),
    getUsers("student"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-zinc-400">
          Cohorts running through the course — each batch has its own students and coursework
        </p>
        <CreateBatchButton />
      </div>

      {unassigned > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-amber-500">
            <span className="font-semibold">
              {unassigned} student{unassigned === 1 ? "" : "s"} not in a batch.
            </span>{" "}
            <span className="text-zinc-400">
              They only see work that isn&apos;t scoped to a batch. Assign them from the Users page.
            </span>
          </p>
        </div>
      )}

      {batchList.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-zinc-500">
          No batches yet. Create one to group your {students.length} student
          {students.length === 1 ? "" : "s"}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {batchList.map((b) => (
            <Card
              key={b.id}
              className="group transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[var(--shadow-pop)]"
            >
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-100 transition-colors group-hover:text-[var(--accent)]">
                      {b.name}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {b.studentCount} student
                        {b.studentCount === 1 ? "" : "s"}
                      </span>
                      {b.startDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatDate(b.startDate)}
                          {b.endDate ? ` – ${formatDate(b.endDate)}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant={statusVariant[b.status ?? "active"]}>{b.status ?? "active"}</Badge>
                </div>

                <div className="mt-auto flex items-center gap-1 border-t border-[var(--line)] pt-3">
                  <EditBatchButton
                    batch={{
                      id: b.id,
                      name: b.name,
                      startDate: b.startDate ?? "",
                      endDate: b.endDate ?? "",
                      status: b.status ?? "active",
                    }}
                  />
                  {session?.role === "admin" && (
                    <DeleteBatchButton id={b.id} name={b.name} studentCount={b.studentCount} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
