import { getAllAssignments } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { AssignmentCard } from "@/components/shared/content-panels";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AssignmentsPage() {
  const session = await getSession();
  const allAssignments = await getAllAssignments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Assignments</h2>
          <p className="text-zinc-400">Track submissions, grades, and feedback</p>
        </div>
        {(session?.role === "admin" || session?.role === "trainer") && (
          <Button>
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {allAssignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={{
              id: assignment.id,
              title: assignment.title,
              description: assignment.description ?? undefined,
              dueDate: assignment.dueDate ?? undefined,
              maxMarks: assignment.maxMarks ?? 100,
              difficulty: assignment.difficulty ?? "medium",
              status: session?.role === "student" ? "revision_needed" : undefined,
              marks: session?.role === "student" ? 70 : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
