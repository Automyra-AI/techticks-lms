import { getChartData } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data";
import { getSession } from "@/lib/auth";

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) return null;

  const [stats, chartData] = await Promise.all([
    getDashboardStats(session),
    getChartData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Analytics</h2>
        <p className="text-zinc-400">Student performance, completion rates, and insights</p>
      </div>

      <DashboardClient
        stats={stats}
        role={session.role}
        chartData={chartData}
        activities={[]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Students</CardTitle>
          </CardHeader>
          <CardContent>
            {["Hamza Khan — 95%", "Ali Hassan — 88%", "Sara Malik — 85%"].map((s) => (
              <div key={s} className="border-b border-zinc-800 py-3 last:border-0 text-sm text-zinc-300">
                {s}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {["Ali Hassan — Attendance 75%", "Ahmed Raza — Assignment overdue"].map((s) => (
              <div key={s} className="border-b border-zinc-800 py-3 last:border-0 text-sm text-zinc-300">
                {s}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
