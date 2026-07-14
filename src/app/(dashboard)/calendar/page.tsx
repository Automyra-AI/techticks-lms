import { getAllSessions, getAllAssignments } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, Video, ClipboardList } from "lucide-react";

export default async function CalendarPage() {
  const sessions = await getAllSessions();
  const assignments = await getAllAssignments();

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Calendar</h2>
        <p className="text-zinc-400">Sessions, assignments, quizzes, and deadlines</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-violet-600/10 p-3">
                <p className="font-medium text-violet-300">Mon — n8n Introduction</p>
                <p className="text-xs text-zinc-500">10:00 AM · Zoom</p>
              </div>
              <div className="rounded-lg bg-amber-600/10 p-3">
                <p className="font-medium text-amber-300">Wed — Assignment Due</p>
                <p className="text-xs text-zinc-500">n8n Workflow Project</p>
              </div>
              <div className="rounded-lg bg-violet-600/10 p-3">
                <p className="font-medium text-violet-300">Fri — Mini Project Session</p>
                <p className="text-xs text-zinc-500">2:00 PM · Live Coding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
