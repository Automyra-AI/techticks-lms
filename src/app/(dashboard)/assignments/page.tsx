import { getAllAssignments, getStudentSubmissions } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { AssignmentCard } from "@/components/shared/content-panels";
import { CreateAssignmentButton, SubmitAssignmentButton } from "@/components/assignments/assignment-actions";

export default async function AssignmentsPage() {
  const session = await getSession();
  const allAssignments = await getAllAssignments();
  const isStaff = session?.role === "admin" || session?.role === "trainer";
  const submissions = session?.role === "student" ? await getStudentSubmissions(session.id) : [];
  const submissionByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Assignments</h2>
          <p className="text-zinc-400">Track submissions, grades, and feedback</p>
        </div>
        {isStaff && <CreateAssignmentButton />}
      </div>

      <div className="grid gap-4">
        {allAssignments.map((assignment) => {
          const sub = submissionByAssignment.get(assignment.id);
          return (
            <div key={assignment.id} className="space-y-2">
              <AssignmentCard
                assignment={{
                  id: assignment.id,
                  title: assignment.title,
                  description: assignment.description ?? undefined,
                  dueDate: assignment.dueDate ?? undefined,
                  maxMarks: assignment.maxMarks ?? 100,
                  difficulty: assignment.difficulty ?? "medium",
                  status: sub?.status ?? undefined,
                  marks: sub?.marks ?? undefined,
                }}
              />
              {session?.role === "student" && (
                <div className="flex justify-end">
                  <SubmitAssignmentButton assignmentId={assignment.id} title={assignment.title} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
