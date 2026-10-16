import {
  getAllAssignments,
  getStudentSubmissions,
  getUserBatchId,
  getAssignmentSubmissionStatus,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { CreateAssignmentButton } from "@/components/assignments/assignment-actions";
import { AssignmentItem } from "@/components/assignments/assignment-item";

export default async function AssignmentsPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";
  // Students see their own batch's work plus anything left unscoped.
  const batchId = session && !isStaff ? await getUserBatchId(session.id) : undefined;
  const allAssignments = await getAllAssignments(batchId);
  // Only staff need to know who has handed in.
  const statuses = isStaff ? await getAssignmentSubmissionStatus() : [];
  const statusById = new Map(statuses.map((x) => [x.assignmentId, x]));
  const submissions = session?.role === "student" ? await getStudentSubmissions(session.id) : [];
  const submissionByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400">Track submissions, grades, and feedback</p>
        </div>
        {isStaff && <CreateAssignmentButton />}
      </div>

      {allAssignments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
          No assignments yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {allAssignments.map((assignment) => {
            const sub = submissionByAssignment.get(assignment.id);
            return (
              <AssignmentItem
                key={assignment.id}
                role={session?.role}
                submissionStatus={statusById.get(assignment.id)}
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
                        content: sub.content,
                        driveUrl: sub.driveUrl,
                        fileUrl: sub.hasFile ? `/api/submissions/file?id=${sub.id}` : undefined,
                        fileName: sub.fileName,
                        submittedAt: sub.submittedAt,
                        updatedAt: sub.updatedAt,
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
