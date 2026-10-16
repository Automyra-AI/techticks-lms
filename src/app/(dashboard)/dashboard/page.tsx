import { getSession } from "@/lib/auth";
import {
  getDashboardStats,
  getChartData,
  getRecentActivities,
  getStudentProgressBreakdown,
  getStudentStreak,
  getStudentBadges,
  getCertificateProgress,
} from "@/lib/data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const isStudent = session.role === "student";
  const [stats, chartData, activities, progress, streak, badges, certificate] = await Promise.all([
    getDashboardStats(session),
    // Only staff render charts — fetching this for a student was two extra
    // table reads whose results were thrown away.
    isStudent
      ? Promise.resolve({ studentGrowth: [], courseCompletion: [], weeklyAttendance: [] })
      : getChartData(),
    getRecentActivities(session),
    isStudent ? getStudentProgressBreakdown(session.id) : Promise.resolve(null),
    isStudent ? getStudentStreak(session.id) : Promise.resolve(null),
    isStudent ? getStudentBadges(session.id) : Promise.resolve(null),
    isStudent ? getCertificateProgress(session.id) : Promise.resolve(null),
  ]);

  return (
    <DashboardClient
      stats={stats}
      role={session.role}
      userName={session.name}
      chartData={chartData}
      activities={activities}
      progress={progress}
      streak={streak}
      badges={badges}
      certificate={certificate}
    />
  );
}
