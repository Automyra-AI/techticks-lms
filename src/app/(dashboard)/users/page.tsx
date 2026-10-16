import { getUsers, getBatchesWithCounts, getStudentProgressRows } from "@/lib/data";
import { StudentProgressCard } from "@/components/users/student-progress";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { AddUserButton, DeleteUserButton, EditUserButton } from "@/components/users/user-actions";
import { Mail, GitBranch } from "lucide-react";

export default async function UsersPage() {
  const session = await getSession();
  const [allUsers, batchList, studentProgress] = await Promise.all([
    getUsers(),
    getBatchesWithCounts(),
    getStudentProgressRows(),
  ]);
  const batchOptions = batchList.map((b) => ({ id: b.id, name: b.name }));
  const batchName = new Map(batchList.map((b) => [b.id, b.name]));

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
              Student progress
            </h3>
            <p className="text-xs text-zinc-500">
              {studentProgress.length} student{studentProgress.length === 1 ? "" : "s"} · click for detail
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {studentProgress.map((s) => (
              <StudentProgressCard key={s.id} student={s} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-zinc-400">
          All accounts
        </h3>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead className="bg-zinc-900">
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Batch</th>
              <th className="p-4 font-medium">Links</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-t border-zinc-800">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/30 text-sm font-bold text-violet-300">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-medium text-zinc-200">{user.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {user.email}
                  </span>
                </td>
                <td className="p-4">
                  <Badge variant={user.role === "admin" ? "info" : user.role === "trainer" ? "warning" : "default"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="p-4 text-sm">
                  {user.role === "student" ? (
                    user.batchId && batchName.has(user.batchId) ? (
                      <span className="text-zinc-300">{batchName.get(user.batchId)}</span>
                    ) : (
                      <span className="text-amber-500">Not assigned</span>
                    )
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
                <td className="p-4">
                  {user.github && (
                    <a href={user.github} className="text-violet-400 hover:underline">
                      <GitBranch className="h-4 w-4" />
                    </a>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <EditUserButton user={user} batches={batchOptions} />
                    {/* No delete control on your own row — the API refuses it anyway. */}
                    {user.id !== session?.id && <DeleteUserButton user={user} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>
    </div>
  );
}
