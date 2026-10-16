import { getUsers, getBatchesWithCounts, getStudentProgressRows } from "@/lib/data";
import { StudentProgressCard } from "@/components/users/student-progress";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddUserButton, DeleteUserButton, EditUserButton } from "@/components/users/user-actions";


export default async function UsersPage() {
  const session = await getSession();
  const [allUsers, batchList, studentProgress] = await Promise.all([
    getUsers(),
    getBatchesWithCounts(),
    getStudentProgressRows(),
  ]);
  const batchOptions = batchList.map((b) => ({ id: b.id, name: b.name }));
  const staff = allUsers.filter((u) => u.role !== "student");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400">Manage admins, trainers, and students</p>
        </div>
        <AddUserButton batches={batchOptions} />
      </div>

      {studentProgress.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-zinc-400">
              Students
            </h3>
            <p className="text-xs text-zinc-500">
              {studentProgress.length} student{studentProgress.length === 1 ? "" : "s"} · click a card for detail
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {studentProgress.map((s) => (
              <StudentProgressCard
                key={s.id}
                student={s}
                batches={batchOptions}
                canDelete={session?.role === "admin" && s.id !== session?.id}
              />
            ))}
          </div>
        </section>
      )}

      {staff.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-zinc-400">
            Admins &amp; trainers
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {staff.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-quiet)] text-sm font-bold text-[var(--accent)]">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-100">{user.name}</p>
                    <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "info" : "warning"}>{user.role}</Badge>
                  <div className="flex shrink-0 items-center">
                    <EditUserButton user={user} batches={batchOptions} />
                    {session?.role === "admin" && user.id !== session?.id && (
                      <DeleteUserButton user={user} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
