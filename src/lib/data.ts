import { eq, desc, and, count, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  courses,
  enrollments,
  assignments,
  submissions,
  sessions,
  roadmapNodes,
  attendance,
  announcements,
  notifications,
  resources,
  weeks,
  weeklyRemarks,
} from "./db/schema";
import type { DashboardStats } from "@/types";
import type { SessionUser } from "./auth";

export async function getAdminStats(): Promise<DashboardStats[]> {
  const [studentCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "student"));
  const [courseCount] = await db.select({ count: count() }).from(courses);
  const [pendingCount] = await db.select({ count: count() }).from(submissions).where(eq(submissions.status, "pending"));
  const [completedCount] = await db.select({ count: count() }).from(submissions).where(eq(submissions.status, "approved"));

  return [
    { label: "Total Students", value: studentCount.count, change: "+12% this month", trend: "up" },
    { label: "Total Courses", value: courseCount.count, change: "+2 new", trend: "up" },
    { label: "Pending Reviews", value: pendingCount.count, change: "Needs attention", trend: "neutral" },
    { label: "Completed Assignments", value: completedCount.count, change: "+8% this week", trend: "up" },
    { label: "Today's Sessions", value: 2, change: "2 upcoming", trend: "neutral" },
    { label: "Weekly Progress", value: "78%", change: "+5%", trend: "up" },
    { label: "Revenue", value: "$12,450", change: "+18%", trend: "up" },
    { label: "Attendance", value: "92%", change: "+3%", trend: "up" },
  ];
}

export async function getTrainerStats(trainerId: string): Promise<DashboardStats[]> {
  const trainerCourses = await db.select().from(courses).where(eq(courses.trainerId, trainerId));
  const courseIds = trainerCourses.map((c) => c.id);

  let studentCount = 0;
  if (courseIds.length > 0) {
    const enrolls = await db.select().from(enrollments);
    studentCount = enrolls.filter((e) => courseIds.includes(e.courseId)).length;
  }

  const [pendingCount] = await db.select({ count: count() }).from(submissions).where(eq(submissions.status, "pending"));

  return [
    { label: "My Students", value: studentCount, change: "+3 this week", trend: "up" },
    { label: "Today's Sessions", value: 1, change: "1 upcoming", trend: "neutral" },
    { label: "Pending Reviews", value: pendingCount.count, change: "Action needed", trend: "neutral" },
    { label: "Average Progress", value: "68%", change: "+4%", trend: "up" },
    { label: "Attendance", value: "89%", change: "-2%", trend: "down" },
    { label: "Announcements", value: 2, change: "Active", trend: "neutral" },
  ];
}

export async function getStudentStats(userId: string): Promise<DashboardStats[]> {
  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.userId, userId)).limit(1);
  const userSubmissions = await db.select().from(submissions).where(eq(submissions.studentId, userId));
  const pendingAssignments = userSubmissions.filter((s) => s.status === "pending" || s.status === "revision_needed").length;
  const completedLessons = userSubmissions.filter((s) => s.status === "approved").length;

  return [
    { label: "Current Week", value: "Week 3", change: "n8n Automation", trend: "neutral" },
    { label: "Course Progress", value: `${enrollment?.progress ?? 0}%`, change: "+8% this week", trend: "up" },
    { label: "Assignments Due", value: pendingAssignments, change: "2 this week", trend: "neutral" },
    { label: "Attendance", value: "90%", change: "Great!", trend: "up" },
    { label: "Completed Lessons", value: completedLessons, change: "+2 this week", trend: "up" },
    { label: "Latest Feedback", value: "B+", change: "REST API assignment", trend: "neutral" },
  ];
}

export async function getDashboardStats(user: SessionUser): Promise<DashboardStats[]> {
  switch (user.role) {
    case "admin":
      return getAdminStats();
    case "trainer":
      return getTrainerStats(user.id);
    case "student":
      return getStudentStats(user.id);
    default:
      return [];
  }
}

export async function getRoadmapNodes(courseId?: string) {
  if (courseId) {
    return db.select().from(roadmapNodes).where(eq(roadmapNodes.courseId, courseId)).orderBy(roadmapNodes.orderIndex);
  }
  const [firstCourse] = await db.select().from(courses).limit(1);
  if (!firstCourse) return [];
  return db.select().from(roadmapNodes).where(eq(roadmapNodes.courseId, firstCourse.id)).orderBy(roadmapNodes.orderIndex);
}

export async function getAllCourses() {
  return db.select().from(courses);
}

export async function getAllAssignments() {
  return db.select().from(assignments).orderBy(desc(assignments.createdAt));
}

export async function getStudentSubmissions(studentId: string) {
  return db.select().from(submissions).where(eq(submissions.studentId, studentId));
}

export async function getAllSessions() {
  return db.select().from(sessions).orderBy(sessions.scheduledAt);
}

export async function getAnnouncements() {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function getResources() {
  return db.select().from(resources).orderBy(desc(resources.createdAt));
}

export async function getWeeks(courseId: string) {
  return db.select().from(weeks).where(eq(weeks.courseId, courseId)).orderBy(weeks.weekNumber);
}

export async function getUsers(role?: "admin" | "trainer" | "student") {
  if (role) {
    return db.select().from(users).where(eq(users.role, role));
  }
  return db.select().from(users);
}

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export async function getNotifications(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function getStudentAttendance(studentId: string) {
  return db.select().from(attendance).where(eq(attendance.studentId, studentId));
}

export async function getWeeklyRemarks(studentId: string) {
  return db.select().from(weeklyRemarks).where(eq(weeklyRemarks.studentId, studentId));
}

export async function getRecentActivities() {
  return [
    { id: "1", action: "Hamza Khan submitted REST API assignment", time: "2 hours ago", type: "submission" },
    { id: "2", action: "Ali Hassan marked present for Session 3", time: "4 hours ago", type: "attendance" },
    { id: "3", action: "New student enrolled in AI Automation Mastery", time: "1 day ago", type: "enrollment" },
    { id: "4", action: "Sarah Ahmed posted Week 3 announcement", time: "1 day ago", type: "announcement" },
    { id: "5", action: "Certificate issued to Hamza Khan", time: "2 days ago", type: "certificate" },
  ];
}

export async function getChartData() {
  return {
    studentGrowth: [
      { month: "Jan", students: 12 },
      { month: "Feb", students: 28 },
      { month: "Mar", students: 45 },
      { month: "Apr", students: 62 },
      { month: "May", students: 78 },
      { month: "Jun", students: 95 },
    ],
    courseCompletion: [
      { name: "Completed", value: 35 },
      { name: "In Progress", value: 45 },
      { name: "Not Started", value: 20 },
    ],
    weeklyAttendance: [
      { week: "W1", attendance: 95 },
      { week: "W2", attendance: 88 },
      { week: "W3", attendance: 92 },
      { week: "W4", attendance: 85 },
    ],
  };
}
