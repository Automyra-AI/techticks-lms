import { getSession } from "@/lib/auth";
import { getStudentAttendance, getAllSessions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate } from "@/lib/utils";

export default async function AttendancePage() {
  const session = await getSession();
  const sessions = await getAllSessions();
  const records = session ? await getStudentAttendance(session.id) : [];

  const attendanceMap = new Map(records.map((r) => [r.sessionId, r.status]));
  const presentCount = records.filter((r) => r.status === "present").length;
  const totalCount = records.length || 1;
  const percentage = Math.round((presentCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Attendance</h2>
        <p className="text-zinc-400">Track session attendance and monthly stats</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-violet-400">{percentage}%</p>
            <ProgressBar value={percentage} className="mt-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions Attended</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-400">{presentCount}</p>
            <p className="mt-1 text-sm text-zinc-500">of {totalCount} sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certificate Requirement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-400">90%</p>
            <p className="mt-1 text-sm text-zinc-500">Minimum required</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
              >
                <div>
                  <p className="font-medium text-zinc-200">{s.title}</p>
                  <p className="text-xs text-zinc-500">
                    {s.scheduledAt ? formatDate(s.scheduledAt) : "TBD"} · {s.duration ?? 90} min
                  </p>
                </div>
                <StatusBadge status={attendanceMap.get(s.id) ?? "absent"} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
