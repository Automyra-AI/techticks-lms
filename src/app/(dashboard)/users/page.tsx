import { getUsers } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { AddUserButton, DeleteUserButton, EditUserButton } from "@/components/users/user-actions";
import { Mail, GitBranch } from "lucide-react";

export default async function UsersPage() {
  const session = await getSession();
  const allUsers = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Users</h2>
          <p className="text-zinc-400">Manage admins, trainers, and students</p>
        </div>
        <AddUserButton />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead className="bg-zinc-900">
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
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
                <td className="p-4">
                  {user.github && (
                    <a href={user.github} className="text-violet-400 hover:underline">
                      <GitBranch className="h-4 w-4" />
                    </a>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <EditUserButton user={user} />
                    {/* No delete control on your own row — the API refuses it anyway. */}
                    {user.id !== session?.id && <DeleteUserButton user={user} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
