"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatsGrid } from "@/components/dashboard/stat-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { StreakCard, BadgesCard, CertificateCard } from "@/components/dashboard/student-widgets";
import type { Badge } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DashboardStats } from "@/types";
import { ArrowRight, Check, Bell, Upload, UserPlus, Megaphone } from "lucide-react";
import Link from "next/link";

// Chart colours, kept in step with the palette in globals.css.
const COLORS = ["#2563eb", "#7fd0bb", "#f7b23b"];
const GRID = "#e8ecf2";
const AXIS = "#7a8699";
const TOOLTIP = { background: "#ffffff", border: "1px solid #e8ecf2", borderRadius: "12px", color: "#18212c" };

interface DashboardClientProps {
  stats: DashboardStats[];
  role: string;
  chartData: {
    studentGrowth: { month: string; students: number }[];
    courseCompletion: { name: string; value: number }[];
    weeklyAttendance: { week: string; attendance: number }[];
  };
  activities: { id: string; action: string; time: string; type: string }[];
  /** Supplied by the dashboard only; analytics reuses this view without a hero. */
  userName?: string;
  progress?: { overall: number; weekProgress: { week: string; progress: number }[] } | null;
  streak?: {
    current: number;
    studiedToday: boolean;
    totalDays: number;
    week: { label: string; date: string; active: boolean; isToday: boolean }[];
  } | null;
  badges?: Badge[] | null;
  certificate?: { requirements: { label: string; met: boolean; detail?: string }[]; allMet: boolean } | null;
}

/** Matches the `type` the activity feed already tags each event with. */
const ACTIVITY_ICONS: Record<string, typeof Bell> = {
  submission: Upload,
  enrollment: UserPlus,
  announcement: Megaphone,
};

/** "Week 3 — n8n Advanced" reads better as "n8n Advanced" beside a number chip. */
function stripWeek(label: string) {
  return label.replace(/^weeks?\s*[\d–-]+\s*[—–-]\s*/i, "").trim() || label;
}

export function DashboardClient({ stats, role, userName, chartData, activities, progress, streak, badges, certificate }: DashboardClientProps) {
  const nextWeek = progress?.weekProgress.find((w) => w.progress < 100) ?? null;

  return (
    <div className="space-y-8">
      {userName && (
      <DashboardHero
        name={userName}
        role={role}
        subtitle={
          role === "student"
            ? nextWeek
              ? `Up next: ${stripWeek(nextWeek.week)}`
              : "Everything on the roadmap is complete."
            : "Overview of your academy"
        }
      />
      )}

      <StatsGrid stats={stats} />

      {role === "student" && streak && (
        <div className="grid gap-6 lg:grid-cols-3">
          <StreakCard streak={streak} />
          {certificate && (
            <div className="lg:col-span-2">
              <CertificateCard progress={certificate} />
            </div>
          )}
        </div>
      )}

      {role === "student" && progress && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* What to do next, taken from the first week that is not finished. */}
          <Card className="lg:col-span-1">
            <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Next up
                </p>
                <p className="mt-2 font-semibold text-zinc-100">{nextWeek ? stripWeek(nextWeek.week) : "All weeks complete"}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {nextWeek
                    ? nextWeek.progress > 0
                      ? `You are ${nextWeek.progress}% through this week.`
                      : "You haven't started this week yet."
                    : "Every topic on the roadmap is ticked off — nice work."}
                </p>
              </div>
              <Link href="/roadmap">
                <Button className="w-full">
                  {nextWeek ? "Open the roadmap" : "Review the roadmap"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-baseline justify-between">
              <CardTitle>Course Progress</CardTitle>
              <span className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                {progress.overall}%
              </span>
            </CardHeader>
            <CardContent>
              <ProgressBar value={progress.overall} size="lg" showLabel={false} />

              {progress.weekProgress.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  {progress.weekProgress.map((w, i) => {
                    const done = w.progress >= 100;
                    return (
                      <div key={w.week} className="flex items-center gap-3">
                        {/* Week number as a chip, so the long titles stay readable. */}
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                            done
                              ? "bg-emerald-500/15 text-emerald-500"
                              : w.progress > 0
                                ? "bg-[var(--accent-quiet)] text-[var(--accent)]"
                                : "bg-[var(--surface-sunk)] text-zinc-500"
                          }`}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </span>
                        <span className="w-44 shrink-0 truncate text-xs text-zinc-400" title={w.week}>
                          {stripWeek(w.week)}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ${
                              done ? "bg-emerald-500" : "bg-[var(--accent)]"
                            }`}
                            style={{ width: `${Math.max(w.progress, 2)}%` }}
                          />
                        </div>
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                          {w.progress}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {role === "student" && badges && badges.length > 0 && <BadgesCard badges={badges} />}

      {(role === "admin" || role === "trainer") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="month" stroke={AXIS} fontSize={12} />
                  <YAxis stroke={AXIS} fontSize={12} />
                  <Tooltip
                    contentStyle={TOOLTIP}
                  />
                  <Line type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.courseCompletion}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {chartData.courseCompletion.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.weeklyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="week" stroke={AXIS} fontSize={12} />
                  <YAxis stroke={AXIS} fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP}
                  />
                  <Bar dataKey="attendance" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/announcements">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Nothing yet — submit an assignment or tick off a topic to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => {
                const Glyph = ACTIVITY_ICONS[activity.type] ?? Bell;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-sunk)] p-3 transition-colors hover:border-[var(--accent)]/30"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-quiet)] text-[var(--accent)]">
                      <Glyph className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-zinc-300">{activity.action}</p>
                    <span className="shrink-0 text-xs text-zinc-500">{activity.time}</span>
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
