import { getSession } from "@/lib/auth";
import {
  getStudentAttendance,
  getAllSessions,
  getSessionsWithAttendance,
  getEnrolledStudents,
} from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";
import {
  CreateSessionButton,
  MarkAttendanceButton,
  DeleteSessionButton,
} from "@/components/attendance/attendance-actions";

export default async function AttendancePage() {
  const session = await getSession();
  const isStaff = session?.role === "admin" || session?.role === "trainer";

  if (isStaff) {
    const [sessionsData, students] = await Promise.all([
      getSessionsWithAttendance(),
      getEnrolledStudents(),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Attendance</h2>
            <p className="text-zinc-400">Create sessions and mark who attended</p>
          </div>
          <CreateSessionButton />
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Users className="h-4 w-4" /> {students.length} enrolled {students.length === 1 ? "student" : "students"}
        </div>

        {sessionsData.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
            No sessions yet. Create one to start taking attendance.
          </p>
        ) : (
          <div className="grid gap-4">
            {sessionsData.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-100">{s.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {s.scheduledAt ? formatDate(s.scheduledAt) : "No date set"}
                      {s.duration ? ` · ${s.duration} min` : ""}
                      {s.meetingPlatform ? ` · ${s.meetingPlatform.replace("_", " ")}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {s.marked === 0
                        ? "Not marked yet"
                        : `${s.present}/${s.total} present · ${s.marked} marked`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MarkAttendanceButton
                      sessionId={s.id}
                      sessionTitle={s.title}
                      students={students}
                      existing={s.statusByStudent}
                    />
                    <DeleteSessionButton id={s.id} title={s.title} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student view — read-only stats + their own session history.
  const sessions = await getAllSessions();
  const records = session ? await getStudentAttendance(session.id) : [];
  const attendanceMap = new Map(records.map((r) => [r.sessionId, r.status]));
  const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length;
  const totalCount = records.length;
  const percentage = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;

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
            <p className="mt-1 text-sm text-zinc-500">of {totalCount} marked sessions</p>
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No sessions scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
