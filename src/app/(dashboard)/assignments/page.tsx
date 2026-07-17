import { getAllAssignments, getStudentSubmissions } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { CreateAssignmentButton } from "@/components/assignments/assignment-actions";
import { AssignmentItem } from "@/components/assignments/assignment-item";

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

      {allAssignments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
          No assignments yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {allAssignments.map((assignment) => {
            const sub = submissionByAssignment.get(assignment.id);
            return (
              <AssignmentItem
                key={assignment.id}
                role={session?.role}
                assignment={{
                  id: assignment.id,
                  title: assignment.title,
                  description: assignment.description,
                  dueDate: assignment.dueDate,
                  maxMarks: assignment.maxMarks,
                  difficulty: assignment.difficulty,
                  submissionFormat: assignment.submissionFormat,
                  attachmentUrl: assignment.attachmentUrl,
                  attachmentName: assignment.attachmentName,
                  hasFile: Boolean(assignment.hasFile),
                }}
                submission={
                  sub
                    ? {
                        status: sub.status,
                        marks: sub.marks,
                        driveUrl: sub.driveUrl,
                        fileUrl: sub.hasFile ? `/api/submissions/file?id=${sub.id}` : undefined,
                        fileName: sub.fileName,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
