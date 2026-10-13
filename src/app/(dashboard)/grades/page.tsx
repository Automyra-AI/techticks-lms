import { getSession } from "@/lib/auth";
import { getStudentSubmissions, getAllAssignments, getSubmissionsForGrading } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AssignmentGroupCard, type GradingRow } from "@/components/grades/assignment-group";

export default async function GradesPage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";

  if (isStaff) {
    const rows = (await getSubmissionsForGrading()) as GradingRow[];
    const pending = rows.filter((r) => r.status === "pending" || r.status === "revision_needed").length;
    const graded = rows.filter((r) => r.status && r.status !== "pending").length;

    // One card per assignment. getSubmissionsForGrading already sorts rows with
    // the unreviewed first, so each group keeps that order internally.
    const byAssignment = new Map<string, GradingRow[]>();
    for (const row of rows) {
      const list = byAssignment.get(row.assignmentId) ?? [];
      list.push(row);
      byAssignment.set(row.assignmentId, list);
    }
    const needsReview = (r: GradingRow) => r.status === "pending" || r.status === "revision_needed";
    const groups = [...byAssignment.entries()]
      .map(([assignmentId, groupRows]) => ({
        assignmentId,
        title: groupRows[0].assignmentTitle,
        rows: groupRows,
        pending: groupRows.filter(needsReview).length,
        latest: groupRows.map((r) => r.updatedAt ?? r.submittedAt).sort().at(-1) ?? "",
      }))
      // Assignments with work waiting rise to the top, then most recent activity.
      .sort((a, b) => (b.pending > 0 ? 1 : 0) - (a.pending > 0 ? 1 : 0) || b.latest.localeCompare(a.latest));

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

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
            No submissions yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {groups.map((g) => (
              <AssignmentGroupCard key={g.assignmentId} title={g.title} rows={g.rows} />
            ))}
          </div>
        )}
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
