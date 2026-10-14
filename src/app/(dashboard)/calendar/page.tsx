import {
  getAllSessions,
  getAllAssignments,
  getStudentActivityDays,
  getUserBatchId,
  getNow,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { StreakCalendar } from "@/components/dashboard/streak-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, Video, ClipboardList } from "lucide-react";

export default async function CalendarPage() {
  const session = await getSession();
  const isStudent = session?.role === "student";
  // Students see their own batch's schedule, not every batch's.
  const batchId = session && isStudent ? await getUserBatchId(session.id) : undefined;

  const [sessions, assignments, activeDays, now] = await Promise.all([
    getAllSessions(batchId),
    getAllAssignments(batchId),
    session && isStudent ? getStudentActivityDays(session.id) : Promise.resolve(null),
    getNow(),
  ]);

  const events = [
    ...sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.scheduledAt,
      type: "session" as const,
      platform: s.meetingPlatform,
    })),
    ...assignments.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.dueDate,
      type: "assignment" as const,
    })),
  ].sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());

  const upcoming = events.filter((e) => e.date && new Date(e.date).getTime() >= now.ms);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-zinc-400">Sessions, assignments, quizzes, and deadlines</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                Nothing scheduled yet. Sessions and assignment due dates appear here.
              </p>
            ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      event.type === "session" ? "bg-violet-600/20" : "bg-amber-600/20"
                    }`}
                  >
                    {event.type === "session" ? (
                      <Video className="h-5 w-5 text-violet-400" />
                    ) : (
                      <ClipboardList className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-200">{event.title}</p>
                    <p className="text-xs text-zinc-500">
                      {event.date ? formatDate(event.date) : "TBD"}
                    </p>
                  </div>
                  <Badge variant={event.type === "session" ? "info" : "warning"}>
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {activeDays ? (
          <StreakCalendar
            activeDays={[...activeDays]}
            todayKey={now.day}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> At a glance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-zinc-400">Scheduled sessions</dt>
                  <dd className="font-semibold tabular-nums text-zinc-100">{sessions.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-zinc-400">Assignments with a due date</dt>
                  <dd className="font-semibold tabular-nums text-zinc-100">
                    {assignments.filter((a) => a.dueDate).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-zinc-400">Still to come</dt>
                  <dd className="font-semibold tabular-nums text-zinc-100">{upcoming.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
