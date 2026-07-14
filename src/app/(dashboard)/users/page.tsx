import { getUsers } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, GitBranch } from "lucide-react";

export default async function UsersPage() {
  const allUsers = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Users</h2>
          <p className="text-zinc-400">Manage admins, trainers, and students</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead className="bg-zinc-900">
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Links</th>
              <th className="p-4 font-medium">Actions</th>
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
                  <Button variant="ghost" size="sm">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
