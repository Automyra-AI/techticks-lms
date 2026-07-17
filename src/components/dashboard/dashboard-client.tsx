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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DashboardStats } from "@/types";
import { Play, ArrowRight } from "lucide-react";
import Link from "next/link";

const COLORS = ["#7c3aed", "#a78bfa", "#52525b"];

interface DashboardClientProps {
  stats: DashboardStats[];
  role: string;
  chartData: {
    studentGrowth: { month: string; students: number }[];
    courseCompletion: { name: string; value: number }[];
    weeklyAttendance: { week: string; attendance: number }[];
  };
  activities: { id: string; action: string; time: string; type: string }[];
  progress?: { overall: number; weekProgress: { week: string; progress: number }[] } | null;
}

export function DashboardClient({ stats, role, chartData, activities, progress }: DashboardClientProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
          <p className="text-zinc-400">Overview of your academy</p>
        </div>
        {role === "student" && (
          <Link href="/roadmap">
            <Button>
              <Play className="h-4 w-4" /> Continue Learning
            </Button>
          </Link>
        )}
      </div>

      <StatsGrid stats={stats} />

      {role === "student" && progress && (
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar value={progress.overall} size="lg" />
            {progress.weekProgress.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {progress.weekProgress.map((w) => (
                  <div key={w.week}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate text-zinc-400">{w.week}</span>
                      <span className="text-zinc-300">{w.progress}%</span>
                    </div>
                    <ProgressBar value={w.progress} showLabel={false} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(role === "admin" || role === "trainer") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="students" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed" }} />
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
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                  />
                  <Bar dataKey="attendance" fill="#7c3aed" radius={[4, 4, 0, 0]} />
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
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <p className="text-sm text-zinc-300">{activity.action}</p>
                <span className="text-xs text-zinc-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
