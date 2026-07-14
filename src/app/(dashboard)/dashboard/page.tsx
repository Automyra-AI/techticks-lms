import { getSession } from "@/lib/auth";
import { getDashboardStats, getChartData, getRecentActivities } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [stats, chartData, activities] = await Promise.all([
    getDashboardStats(session),
    getChartData(),
    getRecentActivities(),
  ]);

  return (
    <DashboardClient
      stats={stats}
      role={session.role}
      chartData={chartData}
      activities={activities}
    />
  );
}
