import { getSession } from "@/lib/auth";
import { getStudentSubmissions, getAllAssignments, getSubmissionsForGrading } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { GradeSubmission } from "@/components/grades/grade-submission";
import { formatDate } from "@/lib/utils";

export default async function GradesPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";

  if (isStaff) {
    const rows = await getSubmissionsForGrading();
    const pending = rows.filter((r) => r.status === "pending" || r.status === "revision_needed").length;
    const graded = rows.filter((r) => r.status && r.status !== "pending").length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Grading</h2>
          <p className="text-zinc-400">Review student submissions and assign marks &amp; feedback</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Total Submissions</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-zinc-100">{rows.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Pending Review</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-amber-400">{pending}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Graded</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-emerald-400">{graded}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Submissions</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((sub) => (
                  <div key={sub.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-800 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-200">{sub.assignmentTitle}</p>
                      <p className="text-xs text-zinc-500">
                        {sub.studentName}
                        {sub.submittedAt ? ` · submitted ${formatDate(sub.submittedAt)}` : ""}
                        {sub.updatedAt ? ` · updated ${formatDate(sub.updatedAt)}` : ""}
                      </p>
                      {sub.feedback && <p className="mt-1 text-xs text-zinc-500">Feedback: {sub.feedback}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.updatedAt && <Badge variant="info">Updated</Badge>}
                      <StatusBadge status={sub.status ?? "pending"} />
                      <span className="text-sm font-bold text-violet-400">
                        {sub.marks ?? "—"}/{sub.maxMarks}
                      </span>
                      <GradeSubmission submission={sub} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student view — read-only scores + feedback.
  const submissions = session ? await getStudentSubmissions(session.id) : [];
  const allAssignments = await getAllAssignments();
  const assignmentMap = new Map(allAssignments.map((a) => [a.id, a]));
  const graded = submissions.filter((s) => s.marks != null);
  const totalMarks = graded.reduce((sum, s) => sum + (s.marks ?? 0), 0);
  const maxMarks = graded.reduce((sum, s) => sum + (assignmentMap.get(s.assignmentId)?.maxMarks ?? 100), 0);
  const average = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Grades</h2>
        <p className="text-zinc-400">Assignment scores and feedback overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Average Score</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-violet-400">{average}%</p>
            <ProgressBar value={average} className="mt-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Assignments Graded</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold text-emerald-400">{graded.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Total Marks</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold text-zinc-100">{totalMarks}/{maxMarks}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Grade Breakdown</CardTitle></CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">You haven&apos;t submitted anything yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const assignment = assignmentMap.get(sub.assignmentId);
                return (
                  <div key={sub.id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                    <div>
                      <p className="font-medium text-zinc-200">{assignment?.title ?? "Assignment"}</p>
                      {sub.feedback && <p className="mt-1 text-sm text-zinc-500">{sub.feedback}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.updatedAt && <Badge variant="info">Updated</Badge>}
                      <StatusBadge status={sub.status ?? "pending"} />
                      <span className="text-lg font-bold text-violet-400">
                        {sub.marks ?? "—"}/{assignment?.maxMarks ?? 100}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
