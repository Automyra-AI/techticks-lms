import { getSession } from "@/lib/auth";
import {
  getDashboardStats,
  getChartData,
  getRecentActivities,
  getStudentProgressBreakdown,
} from "@/lib/data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [stats, chartData, activities, progress] = await Promise.all([
    getDashboardStats(session),
    getChartData(),
    getRecentActivities(session),
    session.role === "student"
      ? getStudentProgressBreakdown(session.id)
      : Promise.resolve(null),
  ]);

  return (
    <DashboardClient
      stats={stats}
      role={session.role}
      chartData={chartData}
      activities={activities}
      progress={progress}
    />
  );
}
