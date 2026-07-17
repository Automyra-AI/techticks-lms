import { eq, desc, sql } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
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
  lessonProgress,
  quizzes,
  quizAttempts,
} from "./db/schema";
import type { DashboardStats } from "@/types";
import type { SessionUser } from "./auth";

const today = () => new Date().toISOString().slice(0, 10);

/** % attended (present or late) across attendance rows; "—" when there are none. */
function attendancePercent(rows: { status: string | null }[]): string {
  if (!rows.length) return "—";
  const attended = rows.filter((r) => r.status === "present" || r.status === "late").length;
  return `${Math.round((attended / rows.length) * 100)}%`;
}

/** Average enrollment progress; "0%" when there are no enrollments. */
function avgProgress(rows: { progress: number | null }[]): string {
  if (!rows.length) return "0%";
  const sum = rows.reduce((acc, r) => acc + (r.progress ?? 0), 0);
  return `${Math.round(sum / rows.length)}%`;
}

export async function getAdminStats(): Promise<DashboardStats[]> {
  const [studentRows, courseRows, subRows, enrollRows, sessionRows, attRows, annRows] =
    await Promise.all([
      db.select().from(users).where(eq(users.role, "student")),
      db.select().from(courses),
      db.select().from(submissions),
      db.select().from(enrollments),
      db.select().from(sessions),
      db.select().from(attendance),
      db.select().from(announcements),
    ]);

  const pending = subRows.filter((s) => s.status === "pending").length;
  const approved = subRows.filter((s) => s.status === "approved").length;
  const todaySessions = sessionRows.filter((s) => (s.scheduledAt ?? "").slice(0, 10) === today()).length;

  return [
    { label: "Total Students", value: studentRows.length, trend: "neutral" },
    { label: "Total Courses", value: courseRows.length, trend: "neutral" },
    { label: "Pending Reviews", value: pending, change: pending ? "Needs attention" : undefined, trend: "neutral" },
    { label: "Completed Assignments", value: approved, trend: "neutral" },
    { label: "Today's Sessions", value: todaySessions, trend: "neutral" },
    { label: "Avg Progress", value: avgProgress(enrollRows), trend: "neutral" },
    { label: "Attendance", value: attendancePercent(attRows), trend: "neutral" },
    { label: "Announcements", value: annRows.length, trend: "neutral" },
  ];
}

export async function getTrainerStats(trainerId: string): Promise<DashboardStats[]> {
  const trainerCourses = await db.select().from(courses).where(eq(courses.trainerId, trainerId));
  const courseIds = trainerCourses.map((c) => c.id);

  const [allEnrolls, subRows, sessionRows, attRows, annRows] = await Promise.all([
    db.select().from(enrollments),
    db.select().from(submissions),
    db.select().from(sessions),
    db.select().from(attendance),
    db.select().from(announcements),
  ]);

  const myEnrolls = allEnrolls.filter((e) => courseIds.includes(e.courseId));
  const pending = subRows.filter((s) => s.status === "pending").length;
  const todaySessions = sessionRows.filter(
    (s) => courseIds.includes(s.courseId) && (s.scheduledAt ?? "").slice(0, 10) === today()
  ).length;

  return [
    { label: "My Students", value: myEnrolls.length, trend: "neutral" },
    { label: "Today's Sessions", value: todaySessions, trend: "neutral" },
    { label: "Pending Reviews", value: pending, change: pending ? "Action needed" : undefined, trend: "neutral" },
    { label: "Average Progress", value: avgProgress(myEnrolls), trend: "neutral" },
    { label: "Attendance", value: attendancePercent(attRows), trend: "neutral" },
    { label: "Announcements", value: annRows.length, trend: "neutral" },
  ];
}

export async function getStudentStats(userId: string): Promise<DashboardStats[]> {
  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.userId, userId)).limit(1);
  const [userSubmissions, myProgress, myAttendance, allAssignments] = await Promise.all([
    db.select().from(submissions).where(eq(submissions.studentId, userId)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(attendance).where(eq(attendance.studentId, userId)),
    db.select().from(assignments),
  ]);

  const submittedIds = new Set(userSubmissions.map((s) => s.assignmentId));
  const dueAssignments = allAssignments.filter((a) => !submittedIds.has(a.id)).length;
  const completedLessons = myProgress.filter((p) => p.completed).length;

  const reviewed = userSubmissions
    .filter((s) => s.reviewedAt)
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""))[0];
  const latestFeedback = reviewed?.marks != null ? `${reviewed.marks}` : "—";

  return [
    { label: "Course Progress", value: `${enrollment?.progress ?? 0}%`, trend: "neutral" },
    { label: "Assignments Due", value: dueAssignments, trend: "neutral" },
    { label: "Completed Lessons", value: completedLessons, trend: "neutral" },
    { label: "Attendance", value: attendancePercent(myAttendance), trend: "neutral" },
    { label: "Latest Grade", value: latestFeedback, trend: "neutral" },
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

/** Each course with its real student count, lesson (roadmap node) count, and avg progress. */
export async function getCoursesWithStats() {
  const [courseRows, enrollRows, nodeRows] = await Promise.all([
    db.select().from(courses),
    db.select().from(enrollments),
    db.select().from(roadmapNodes),
  ]);

  return courseRows.map((course) => {
    const courseEnrolls = enrollRows.filter((e) => e.courseId === course.id);
    const lessons = nodeRows.filter((n) => n.courseId === course.id).length;
    const progress = courseEnrolls.length
      ? Math.round(courseEnrolls.reduce((a, e) => a + (e.progress ?? 0), 0) / courseEnrolls.length)
      : 0;
    return { ...course, students: courseEnrolls.length, lessons, progress };
  });
}

/** Overall + per-week progress for a student, derived from roadmap node completion. */
export async function getStudentProgressBreakdown(userId: string) {
  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.userId, userId)).limit(1);
  const [nodeRows, myProgress] = await Promise.all([
    db.select().from(roadmapNodes).orderBy(roadmapNodes.orderIndex),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
  ]);

  const completedNodeIds = new Set(myProgress.filter((p) => p.completed).map((p) => p.nodeId));

  // Group nodes by their "Week …" label (parsed from the description prefix).
  const weekMap = new Map<string, { total: number; done: number }>();
  for (const n of nodeRows) {
    const label = (n.description ?? "").split("·")[0].trim() || "Other";
    const bucket = weekMap.get(label) ?? { total: 0, done: 0 };
    bucket.total += 1;
    if (completedNodeIds.has(n.id)) bucket.done += 1;
    weekMap.set(label, bucket);
  }

  const weekProgress = [...weekMap.entries()].map(([week, b]) => ({
    week,
    progress: b.total ? Math.round((b.done / b.total) * 100) : 0,
  }));

  return { overall: enrollment?.progress ?? 0, weekProgress };
}

export async function getAllAssignments() {
  // Exclude the (potentially large) base64 attachmentData from the list; expose
  // a hasFile flag so the UI can link to the file-serving route instead.
  return db
    .select({
      id: assignments.id,
      courseId: assignments.courseId,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      maxMarks: assignments.maxMarks,
      difficulty: assignments.difficulty,
      submissionFormat: assignments.submissionFormat,
      attachmentUrl: assignments.attachmentUrl,
      attachmentName: assignments.attachmentName,
      hasFile: sql<number>`case when ${assignments.attachmentData} is not null then 1 else 0 end`,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .orderBy(desc(assignments.createdAt));
}

export async function getStudentSubmissions(studentId: string) {
  return db
    .select({
      id: submissions.id,
      assignmentId: submissions.assignmentId,
      content: submissions.content,
      driveUrl: submissions.driveUrl,
      githubUrl: submissions.githubUrl,
      status: submissions.status,
      marks: submissions.marks,
      feedback: submissions.feedback,
      submittedAt: submissions.submittedAt,
      fileName: submissions.fileName,
      hasFile: sql<number>`case when ${submissions.fileData} is not null then 1 else 0 end`,
    })
    .from(submissions)
    .where(eq(submissions.studentId, studentId));
}

/**
 * All submissions enriched with student name and assignment title/maxMarks,
 * for the trainer grading queue. Ungraded (pending/revision) surface first.
 */
export async function getSubmissionsForGrading() {
  const [subRows, userRows, assignmentRows] = await Promise.all([
    db
      .select({
        id: submissions.id,
        studentId: submissions.studentId,
        assignmentId: submissions.assignmentId,
        driveUrl: submissions.driveUrl,
        githubUrl: submissions.githubUrl,
        content: submissions.content,
        status: submissions.status,
        marks: submissions.marks,
        feedback: submissions.feedback,
        submittedAt: submissions.submittedAt,
        fileName: submissions.fileName,
        hasFile: sql<number>`case when ${submissions.fileData} is not null then 1 else 0 end`,
      })
      .from(submissions)
      .orderBy(desc(submissions.submittedAt)),
    db.select().from(users),
    db.select().from(assignments),
  ]);
  const userById = new Map(userRows.map((u) => [u.id, u]));
  const assignmentById = new Map(assignmentRows.map((a) => [a.id, a]));

  const rank = (status: string | null) =>
    status === "pending" ? 0 : status === "revision_needed" ? 1 : status === "late" ? 2 : 3;

  return subRows
    .map((s) => ({
      id: s.id,
      studentName: userById.get(s.studentId)?.name ?? "Student",
      studentEmail: userById.get(s.studentId)?.email ?? "",
      assignmentTitle: assignmentById.get(s.assignmentId)?.title ?? "Assignment",
      maxMarks: assignmentById.get(s.assignmentId)?.maxMarks ?? 100,
      driveUrl: s.driveUrl,
      githubUrl: s.githubUrl,
      content: s.content,
      fileUrl: s.hasFile ? `/api/submissions/file?id=${s.id}` : null,
      fileName: s.fileName,
      status: s.status,
      marks: s.marks,
      feedback: s.feedback,
      submittedAt: s.submittedAt,
    }))
    .sort((a, b) => rank(a.status) - rank(b.status) || (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
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

/** Students enrolled across all courses (id, name, email), for attendance rosters. */
export async function getEnrolledStudents() {
  const [enrollRows, userRows] = await Promise.all([
    db.select().from(enrollments),
    db.select().from(users).where(eq(users.role, "student")),
  ]);
  const enrolledIds = new Set(enrollRows.map((e) => e.userId));
  return userRows
    .filter((u) => enrolledIds.has(u.id))
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

/**
 * Sessions with their attendance: a per-student status map and a present/total
 * summary. Used by the trainer attendance manager.
 */
export async function getSessionsWithAttendance() {
  const [sessionRows, attRows, students] = await Promise.all([
    db.select().from(sessions).orderBy(desc(sessions.scheduledAt)),
    db.select().from(attendance),
    getEnrolledStudents(),
  ]);

  return sessionRows.map((s) => {
    const marks = attRows.filter((a) => a.sessionId === s.id);
    const statusByStudent: Record<string, string> = {};
    for (const m of marks) statusByStudent[m.studentId] = m.status;
    const present = marks.filter((m) => m.status === "present" || m.status === "late").length;
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      scheduledAt: s.scheduledAt,
      duration: s.duration,
      meetingPlatform: s.meetingPlatform,
      meetingUrl: s.meetingUrl,
      statusByStudent,
      marked: marks.length,
      present,
      total: students.length,
    };
  });
}

export async function getWeeklyRemarks(studentId: string) {
  return db.select().from(weeklyRemarks).where(eq(weeklyRemarks.studentId, studentId));
}

/** Real certificate-requirement status for a student. */
export async function getCertificateProgress(userId: string) {
  const [attRows, assignmentRows, subRows, attemptRows] = await Promise.all([
    db.select().from(attendance).where(eq(attendance.studentId, userId)),
    db.select().from(assignments),
    db.select().from(submissions).where(eq(submissions.studentId, userId)),
    db.select().from(quizAttempts).where(eq(quizAttempts.studentId, userId)),
  ]);

  // Attendance ≥ 90%
  const attended = attRows.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = attRows.length ? Math.round((attended / attRows.length) * 100) : 0;
  const attendanceMet = attRows.length > 0 && attendancePct >= 90;

  // Every assignment has an approved submission from this student
  const approvedIds = new Set(subRows.filter((s) => s.status === "approved").map((s) => s.assignmentId));
  const approvedCount = assignmentRows.filter((a) => approvedIds.has(a.id)).length;
  const assignmentsMet = assignmentRows.length > 0 && approvedCount === assignmentRows.length;

  // Final project = an assignment whose title mentions "final"/"project", approved
  const finalAssignments = assignmentRows.filter((a) => /final|project/i.test(a.title));
  const finalMet = finalAssignments.length > 0 && finalAssignments.every((a) => approvedIds.has(a.id));

  // At least one quiz passed
  const quizMet = attemptRows.some((a) => a.passed);

  const requirements = [
    {
      label: "90% Attendance",
      met: attendanceMet,
      detail: attRows.length ? `${attendancePct}% of ${attRows.length} sessions` : "no attendance yet",
    },
    {
      label: "Assignments Completed",
      met: assignmentsMet,
      detail: assignmentRows.length ? `${approvedCount}/${assignmentRows.length} approved` : "no assignments yet",
    },
    {
      label: "Final Project Approved",
      met: finalMet,
      detail: finalAssignments.length ? undefined : "no final project set",
    },
    {
      label: "Quiz Passed",
      met: quizMet,
      detail: attemptRows.length ? `${attemptRows.filter((a) => a.passed).length} passed` : "no quiz taken",
    },
  ];

  return { requirements, allMet: requirements.every((r) => r.met) };
}

type QuizQuestion = { question: string; options: string[]; correctIndex: number };

function parseQuestions(json: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Quizzes with question count, attempt stats, and per-student results (trainer view). */
export async function getQuizzesForStaff() {
  const [quizRows, attemptRows, userRows] = await Promise.all([
    db.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
    db.select().from(quizAttempts).orderBy(desc(quizAttempts.submittedAt)),
    db.select().from(users),
  ]);
  const userById = new Map(userRows.map((u) => [u.id, u]));
  return quizRows.map((q) => {
    const attempts = attemptRows.filter((a) => a.quizId === q.id);
    const passedCount = attempts.filter((a) => a.passed).length;
    const parsed = parseQuestions(q.questions);
    return {
      id: q.id,
      title: q.title,
      timeLimit: q.timeLimit ?? 10,
      passingScore: q.passingScore ?? 70,
      questions: parsed,
      questionCount: parsed.length,
      attempts: attempts.length,
      passed: passedCount,
      attemptList: attempts.map((a) => ({
        studentName: userById.get(a.studentId)?.name ?? "Student",
        studentEmail: userById.get(a.studentId)?.email ?? "",
        score: a.score,
        total: a.total,
        percent: a.total ? Math.round((a.score / a.total) * 100) : 0,
        passed: a.passed,
        reason: a.reason,
        submittedAt: a.submittedAt,
      })),
    };
  });
}

/**
 * Quizzes for a student — questions with the correct answers STRIPPED so they
 * never reach the browser — plus this student's attempt result if any.
 */
export async function getQuizzesForStudent(studentId: string) {
  const [quizRows, attemptRows] = await Promise.all([
    db.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
    db.select().from(quizAttempts).where(eq(quizAttempts.studentId, studentId)),
  ]);
  const attemptByQuiz = new Map(attemptRows.map((a) => [a.quizId, a]));
  return quizRows.map((q) => {
    const questions = parseQuestions(q.questions);
    const attempt = attemptByQuiz.get(q.id);
    return {
      id: q.id,
      title: q.title,
      timeLimit: q.timeLimit ?? 10,
      passingScore: q.passingScore ?? 70,
      questionCount: questions.length,
      // No correctIndex — only the question text and options.
      questions: questions.map((qq) => ({ question: qq.question, options: qq.options })),
      attempt: attempt
        ? { score: attempt.score, total: attempt.total, passed: attempt.passed, reason: attempt.reason }
        : null,
    };
  });
}

const rel = (iso?: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "";

/** Recent real events across submissions, enrollments, and announcements. */
export async function getRecentActivities() {
  const [subRows, enrollRows, annRows, userRows, assignmentRows] = await Promise.all([
    db.select().from(submissions).orderBy(desc(submissions.submittedAt)).limit(5),
    db.select().from(enrollments).orderBy(desc(enrollments.enrolledAt)).limit(5),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(5),
    db.select().from(users),
    db.select().from(assignments),
  ]);

  const userName = (id: string) => userRows.find((u) => u.id === id)?.name ?? "Someone";
  const assignmentTitle = (id: string) => assignmentRows.find((a) => a.id === id)?.title ?? "an assignment";

  const events = [
    ...subRows.map((s) => ({
      id: `sub-${s.id}`,
      action: `${userName(s.studentId)} submitted “${assignmentTitle(s.assignmentId)}”`,
      at: s.submittedAt,
      type: "submission",
    })),
    ...enrollRows.map((e) => ({
      id: `enr-${e.id}`,
      action: `${userName(e.userId)} enrolled in a course`,
      at: e.enrolledAt,
      type: "enrollment",
    })),
    ...annRows.map((a) => ({
      id: `ann-${a.id}`,
      action: `New announcement: “${a.title}”`,
      at: a.createdAt,
      type: "announcement",
    })),
  ];

  return events
    .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))
    .slice(0, 6)
    .map(({ id, action, at, type }) => ({ id, action, time: rel(at), type }));
}

/** Charts derived from real data; empty arrays when there's nothing to show. */
export async function getChartData() {
  const [studentRows, nodeRows, attRows, sessionRows, weekRows] = await Promise.all([
    db.select().from(users).where(eq(users.role, "student")),
    db.select().from(roadmapNodes),
    db.select().from(attendance),
    db.select().from(sessions),
    db.select().from(weeks),
  ]);

  // Cumulative student sign-ups by month.
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const byMonth = new Map<string, number>();
  for (const u of studentRows) {
    const key = (u.createdAt ?? "").slice(0, 7); // YYYY-MM
    if (key) byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  let running = 0;
  const studentGrowth = [...byMonth.keys()]
    .sort()
    .map((key) => {
      running += byMonth.get(key) ?? 0;
      return { month: months[Number(key.slice(5, 7)) - 1] ?? key, students: running };
    });

  // Course completion from roadmap node statuses.
  const completed = nodeRows.filter((n) => n.status === "completed").length;
  const inProgress = nodeRows.filter((n) => n.status === "in_progress").length;
  const notStarted = nodeRows.length - completed - inProgress;
  const pct = (n: number) => (nodeRows.length ? Math.round((n / nodeRows.length) * 100) : 0);
  const courseCompletion = nodeRows.length
    ? [
        { name: "Completed", value: pct(completed) },
        { name: "In Progress", value: pct(inProgress) },
        { name: "Not Started", value: pct(notStarted) },
      ]
    : [];

  // Attendance % per week (attendance → session → week number).
  const weekOfSession = new Map(sessionRows.map((s) => [s.id, s.weekId]));
  const numberOfWeek = new Map(weekRows.map((w) => [w.id, w.weekNumber]));
  const perWeek = new Map<number, { attended: number; total: number }>();
  for (const a of attRows) {
    const weekId = weekOfSession.get(a.sessionId);
    const num = weekId ? numberOfWeek.get(weekId) : undefined;
    if (num == null) continue;
    const bucket = perWeek.get(num) ?? { attended: 0, total: 0 };
    bucket.total += 1;
    if (a.status === "present" || a.status === "late") bucket.attended += 1;
    perWeek.set(num, bucket);
  }
  const weeklyAttendance = [...perWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([num, b]) => ({ week: `W${num}`, attendance: Math.round((b.attended / b.total) * 100) }));

  return { studentGrowth, courseCompletion, weeklyAttendance };
}
