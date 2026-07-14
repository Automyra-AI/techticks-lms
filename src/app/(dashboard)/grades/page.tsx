import { getSession } from "@/lib/auth";
import { getStudentSubmissions, getAllAssignments } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export default async function GradesPage() {
  const session = await getSession();
  const submissions = session ? await getStudentSubmissions(session.id) : [];
  const allAssignments = await getAllAssignments();

  const assignmentMap = new Map(allAssignments.map((a) => [a.id, a]));
  const totalMarks = submissions.reduce((sum, s) => sum + (s.marks ?? 0), 0);
  const maxMarks = submissions.reduce(
    (sum, s) => sum + (assignmentMap.get(s.assignmentId)?.maxMarks ?? 100),
    0
  );
  const average = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Grades</h2>
        <p className="text-zinc-400">Assignment scores and feedback overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-violet-400">{average}%</p>
            <ProgressBar value={average} className="mt-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignments Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-400">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-zinc-100">
              {totalMarks}/{maxMarks}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {submissions.map((sub) => {
              const assignment = assignmentMap.get(sub.assignmentId);
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{assignment?.title ?? "Assignment"}</p>
                    {sub.feedback && (
                      <p className="mt-1 text-sm text-zinc-500">{sub.feedback}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={sub.status ?? "pending"} />
                    <span className="text-lg font-bold text-violet-400">
                      {sub.marks ?? "—"}/{assignment?.maxMarks ?? 100}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
