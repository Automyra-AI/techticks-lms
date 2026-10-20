import { eq, desc, sql } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { cache } from "react";
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
  batches,
  presentations,
  presentationGroups,
  presentationMembers,
  quizzes,
  quizAttempts,
} from "./db/schema";
import type { DashboardStats } from "@/types";
import type { SessionUser } from "./auth";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * The calendar day an instant falls on, in the course's timezone.
 *
 * Slicing a UTC ISO string credits anyone studying after midnight local time to
 * the previous day — in Pakistan (UTC+5) that is every late-night session,
 * which would silently break streaks.
 */
const COURSE_UTC_OFFSET_MINUTES = 5 * 60; // Asia/Karachi
export function localDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Date(d.getTime() + COURSE_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

/**
 * Submission columns without the inline file.
 *
 * `submissions.file_data` holds uploads as base64, and a bare
 * `select().from(submissions)` pulls every one of them — 4MB+ across the
 * table, which made a single query take ~7s against the remote database
 * versus ~0.6s for the same rows with the blob left behind. Nothing outside
 * the file-download route needs the bytes, so everything else uses this.
 */
const submissionFields = {
  id: submissions.id,
  assignmentId: submissions.assignmentId,
  studentId: submissions.studentId,
  content: submissions.content,
  fileName: submissions.fileName,
  fileType: submissions.fileType,
  githubUrl: submissions.githubUrl,
  driveUrl: submissions.driveUrl,
  status: submissions.status,
  marks: submissions.marks,
  feedback: submissions.feedback,
  remarks: submissions.remarks,
  submittedAt: submissions.submittedAt,
  updatedAt: submissions.updatedAt,
  reviewedAt: submissions.reviewedAt,
  hasFile: sql<number>`case when ${submissions.fileData} is not null then 1 else 0 end`,
};

/** Assignment columns without the inline attachment, for the same reason. */
const assignmentFields = {
  id: assignments.id,
  courseId: assignments.courseId,
  batchId: assignments.batchId,
  weekId: assignments.weekId,
  nodeId: assignments.nodeId,
  title: assignments.title,
  description: assignments.description,
  dueDate: assignments.dueDate,
  maxMarks: assignments.maxMarks,
  difficulty: assignments.difficulty,
  rubric: assignments.rubric,
  submissionFormat: assignments.submissionFormat,
  attachmentUrl: assignments.attachmentUrl,
  attachmentName: assignments.attachmentName,
  attachmentType: assignments.attachmentType,
  createdAt: assignments.createdAt,
  hasFile: sql<number>`case when ${assignments.attachmentData} is not null then 1 else 0 end`,
};

/*
 * Per-request table loaders.
 *
 * Rendering one dashboard used to read `submissions` five separate times —
 * once each for the stats, the streak, the badges, the certificate and the
 * activity feed — and `assignments`, `attendance` and `quiz_attempts` three
 * times apiece. Every one of those is a round trip to a database in another
 * region.
 *
 * React's `cache` memoises for the lifetime of a single request, so each table
 * is fetched once per render no matter how many functions ask for it. The
 * tables are small enough (tens to low hundreds of rows) that reading all of
 * one and filtering in memory beats repeated filtered queries; if any of them
 * grows into the thousands, move that one back to a filtered query.
 */
const loadSubmissions = cache(async () => db.select(submissionFields).from(submissions));
const loadAssignments = cache(async () => db.select(assignmentFields).from(assignments));
const loadUsers = cache(async () => db.select().from(users));
const loadAttendance = cache(async () => db.select().from(attendance));
const loadQuizAttempts = cache(async () => db.select().from(quizAttempts));
const loadRoadmapNodes = cache(async () => db.select().from(roadmapNodes));
const loadEnrollments = cache(async () => db.select().from(enrollments));
const loadBatches = cache(async () => db.select().from(batches));

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
      loadUsers().then((r) => r.filter((u) => u.role === "student")),
      db.select().from(courses),
      loadSubmissions(),
      loadEnrollments(),
      db.select().from(sessions),
      loadAttendance(),
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
    loadEnrollments(),
    loadSubmissions(),
    db.select().from(sessions),
    loadAttendance(),
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
  const [enrollment] = (await loadEnrollments()).filter((e) => e.userId === userId);
  const batchId = await getUserBatchId(userId);
  const [userSubmissions, nodeRows, myAttendance, everyAssignment] = await Promise.all([
    loadSubmissions().then((r) => r.filter((x) => x.studentId === userId)),
    loadRoadmapNodes(),
    loadAttendance().then((r) => r.filter((x) => x.studentId === userId)),
    loadAssignments(),
  ]);
  // Work from another batch is invisible to this student, so it must not count
  // against them in "due" or towards the certificate.
  const allAssignments = everyAssignment.filter((a) => visibleToBatch(a.batchId, batchId));

  const submittedIds = new Set(userSubmissions.map((s) => s.assignmentId));
  const dueAssignments = allAssignments.filter((a) => !submittedIds.has(a.id)).length;
  // Topics are ticked off by the trainer for the whole class, so "completed"
  // is course progress, not something the student marks themselves.
  const completedLessons = nodeRows.filter((n) => n.status === "completed").length;

  const reviewed = userSubmissions
    .filter((s) => s.reviewedAt)
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""))[0];
  const latestFeedback = reviewed?.marks != null ? `${reviewed.marks}` : "—";

  // Same source as the Course Progress card: topics the trainer has covered.
  // `enrollments.progress` is never written to, so reading it showed 0% forever.
  const coursePercent = nodeRows.length
    ? Math.round((completedLessons / nodeRows.length) * 100)
    : (enrollment?.progress ?? 0);

  return [
    { label: "Course Progress", value: `${coursePercent}%`, trend: "neutral" },
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
    loadEnrollments(),
    loadRoadmapNodes(),
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

/**
 * Overall and per-week progress.
 *
 * Topics are ticked off by the trainer for the whole class, so progress is read
 * from the shared roadmap rather than from anything the student marks.
 */
export async function getStudentProgressBreakdown(userId: string) {
  const [enrollment] = (await loadEnrollments()).filter((e) => e.userId === userId);
  const nodeRows = await db.select().from(roadmapNodes).orderBy(roadmapNodes.orderIndex);

  const completed = nodeRows.filter((n) => n.status === "completed").length;
  const overall = nodeRows.length ? Math.round((completed / nodeRows.length) * 100) : (enrollment?.progress ?? 0);

  // Group nodes by their "Week …" label (parsed from the description prefix).
  const weekMap = new Map<string, { total: number; done: number }>();
  for (const n of nodeRows) {
    const label = (n.description ?? "").split("·")[0].trim() || "Other";
    const bucket = weekMap.get(label) ?? { total: 0, done: 0 };
    bucket.total += 1;
    if (n.status === "completed") bucket.done += 1;
    weekMap.set(label, bucket);
  }

  const weekProgress = [...weekMap.entries()].map(([week, b]) => ({
    week,
    progress: b.total ? Math.round((b.done / b.total) * 100) : 0,
  }));

  return { overall, weekProgress };
}

export async function getAllAssignments(batchId?: string | null) {
  // Exclude the (potentially large) base64 attachmentData from the list; expose
  // a hasFile flag so the UI can link to the file-serving route instead.
  const rows = await db
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
      batchId: assignments.batchId,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .orderBy(desc(assignments.createdAt));

  if (batchId === undefined) return rows;
  return rows.filter((a) => visibleToBatch(a.batchId, batchId));
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
      updatedAt: submissions.updatedAt,
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
        updatedAt: submissions.updatedAt,
        fileName: submissions.fileName,
        hasFile: sql<number>`case when ${submissions.fileData} is not null then 1 else 0 end`,
      })
      .from(submissions)
      .orderBy(desc(submissions.submittedAt)),
    loadUsers(),
    loadAssignments(),
  ]);
  const userById = new Map(userRows.map((u) => [u.id, u]));
  const assignmentById = new Map(assignmentRows.map((a) => [a.id, a]));

  const rank = (status: string | null) =>
    status === "pending" ? 0 : status === "revision_needed" ? 1 : status === "late" ? 2 : 3;

  return subRows
    .map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
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
      updatedAt: s.updatedAt,
    }))
    .sort((a, b) => {
      const latest = (r: { submittedAt: string | null; updatedAt: string | null }) =>
        r.updatedAt ?? r.submittedAt ?? "";
      return rank(a.status) - rank(b.status) || latest(b).localeCompare(latest(a));
    });
}

export async function getAllSessions(batchId?: string | null) {
  const rows = await db.select().from(sessions).orderBy(sessions.scheduledAt);
  if (batchId === undefined) return rows;
  return rows.filter((x) => visibleToBatch(x.batchId, batchId));
}

export async function getAnnouncements(batchId?: string | null) {
  const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  if (batchId === undefined) return rows;
  return rows.filter((a) => visibleToBatch(a.batchId, batchId));
}

export async function getResources() {
  return db.select().from(resources).orderBy(desc(resources.createdAt));
}

export async function getWeeks(courseId: string) {
  return db.select().from(weeks).where(eq(weeks.courseId, courseId)).orderBy(weeks.weekNumber);
}

export async function getUsers(role?: "admin" | "trainer" | "student") {
  if (role) {
    return (await loadUsers()).filter((u) => u.role === role);
  }
  return db.select().from(users);
}

/**
 * Every student with the numbers a trainer actually wants when scanning the
 * roster: how much of the coursework they have handed in, how it was graded,
 * their attendance and their quiz record.
 *
 * Built from four whole-table reads and joined in memory rather than one query
 * per student — a per-student query would be ~15 round trips on a remote
 * database.
 */
export async function getStudentProgressRows() {
  const [userRows, batchRows, subRows, everyAssignment, attRows, attemptRows] = await Promise.all([
    loadUsers().then((r) => r.filter((u) => u.role === "student")),
    loadBatches(),
    loadSubmissions(),
    loadAssignments(),
    loadAttendance(),
    loadQuizAttempts(),
  ]);

  const batchName = new Map(batchRows.map((b) => [b.id, b.name]));

  return userRows
    .map((u) => {
      // Only work this student can actually see counts towards their totals.
      const theirAssignments = everyAssignment.filter((a) => visibleToBatch(a.batchId, u.batchId));
      const mySubs = subRows.filter((x) => x.studentId === u.id);
      const submittedIds = new Set(mySubs.map((x) => x.assignmentId));

      const submitted = theirAssignments.filter((a) => submittedIds.has(a.id)).length;
      const approved = mySubs.filter((x) => x.status === "approved").length;
      const pending = mySubs.filter((x) => x.status === "pending" || x.status === "revision_needed").length;

      const graded = mySubs.filter((x) => x.marks != null);
      const maxFor = (id: string) => theirAssignments.find((a) => a.id === id)?.maxMarks ?? 100;
      const scoreTotal = graded.reduce((sum, x) => sum + (x.marks ?? 0), 0);
      const scoreMax = graded.reduce((sum, x) => sum + maxFor(x.assignmentId), 0);

      const myAtt = attRows.filter((a) => a.studentId === u.id);
      const present = myAtt.filter((a) => a.status === "present" || a.status === "late").length;

      const myAttempts = attemptRows.filter((a) => a.studentId === u.id);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        batchId: u.batchId,
        batchName: u.batchId ? (batchName.get(u.batchId) ?? null) : null,
        github: u.github,
        joined: u.createdAt,
        totalAssignments: theirAssignments.length,
        submitted,
        approved,
        pending,
        // Share of their coursework handed in — the headline "progress rate".
        completion: theirAssignments.length
          ? Math.round((submitted / theirAssignments.length) * 100)
          : 0,
        averageScore: scoreMax > 0 ? Math.round((scoreTotal / scoreMax) * 100) : null,
        attendanceMarked: myAtt.length,
        attendanceRate: myAtt.length ? Math.round((present / myAtt.length) * 100) : null,
        quizzesTaken: myAttempts.length,
        quizzesPassed: myAttempts.filter((a) => a.passed).length,
      };
    })
    .sort((a, b) => b.completion - a.completion || a.name.localeCompare(b.name));
}

/**
 * Per-assignment submission status: who has handed in and who has not.
 * Students outside the assignment's batch are not expected to submit at all,
 * so they are left out of both lists.
 */
export async function getAssignmentSubmissionStatus() {
  const [everyAssignment, studentRows, subRows] = await Promise.all([
    loadAssignments(),
    loadUsers().then((r) => r.filter((u) => u.role === "student")),
    loadSubmissions(),
  ]);

  return everyAssignment.map((a) => {
    const expected = studentRows.filter((u) => visibleToBatch(a.batchId, u.batchId));
    const subs = subRows.filter((x) => x.assignmentId === a.id);
    const byStudent = new Map(subs.map((x) => [x.studentId, x]));

    const submitted = expected
      .filter((u) => byStudent.has(u.id))
      .map((u) => {
        const sub = byStudent.get(u.id)!;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          status: sub.status,
          marks: sub.marks,
          submittedAt: sub.submittedAt,
          updatedAt: sub.updatedAt,
        };
      });

    const missing = expected
      .filter((u) => !byStudent.has(u.id))
      .map((u) => ({ id: u.id, name: u.name, email: u.email }));

    return {
      assignmentId: a.id,
      title: a.title,
      dueDate: a.dueDate,
      maxMarks: a.maxMarks ?? 100,
      expected: expected.length,
      submitted,
      missing,
    };
  });
}

/**
 * Presentation rounds with their groups and members.
 *
 * `forStudent` narrows to rounds that student can see — their batch, or an
 * unscoped one — which is what the student portal renders.
 */
export async function getPresentations(forStudent?: { id: string; batchId: string | null }) {
  const [rounds, groups, members, studentRows] = await Promise.all([
    db.select().from(presentations),
    db.select().from(presentationGroups),
    db.select().from(presentationMembers),
    loadUsers().then((r) => r.filter((u) => u.role === "student")),
  ]);

  const studentById = new Map(studentRows.map((u) => [u.id, u]));

  const visible = forStudent
    ? rounds.filter((p) => visibleToBatch(p.batchId, forStudent.batchId))
    : rounds;

  return visible
    .map((round) => {
      const roundGroups = groups
        .filter((g) => g.presentationId === round.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((g) => ({
          id: g.id,
          name: g.name,
          topic: g.topic,
          notes: g.notes,
          members: members
            .filter((m) => m.groupId === g.id)
            .map((m) => {
              const u = studentById.get(m.studentId);
              return { id: m.studentId, name: u?.name ?? "Student", email: u?.email ?? "" };
            }),
        }));

      const assigned = new Set(roundGroups.flatMap((g) => g.members.map((m) => m.id)));
      // Who in this round's batch has not been placed in a group yet.
      const unassigned = studentRows
        .filter((u) => visibleToBatch(round.batchId, u.batchId) && !assigned.has(u.id))
        .map((u) => ({ id: u.id, name: u.name, email: u.email }));

      return {
        id: round.id,
        title: round.title,
        description: round.description,
        mode: round.mode ?? "group",
        batchId: round.batchId,
        scheduledAt: round.scheduledAt,
        groups: roundGroups,
        unassigned,
        // For the student portal: the slot this student is in, if any.
        mine: forStudent
          ? (roundGroups.find((g) => g.members.some((m) => m.id === forStudent.id)) ?? null)
          : null,
      };
    })
    .sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""));
}

/** Students eligible for a round — those in its batch, or everyone if unscoped. */
export async function getStudentsForBatch(batchId: string | null) {
  const studentRows = await loadUsers().then((r) => r.filter((u) => u.role === "student"));
  return studentRows
    .filter((u) => visibleToBatch(batchId, u.batchId))
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

export async function getUserById(userId: string) {
  const user = (await loadUsers()).find((u) => u.id === userId);
  return user ?? null;
}

export async function getNotifications(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function getStudentAttendance(studentId: string) {
  return loadAttendance().then((r) => r.filter((x) => x.studentId === studentId));
}

/** Students enrolled across all courses (id, name, email), for attendance rosters. */
export async function getEnrolledStudents() {
  const [enrollRows, userRows] = await Promise.all([
    loadEnrollments(),
    loadUsers().then((r) => r.filter((u) => u.role === "student")),
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
    loadAttendance(),
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
/**
 * Daily study streak, built from the timestamps already recorded elsewhere:
 * ticking off a roadmap topic, submitting work, sitting a quiz, or being marked
 * present. Any of those counts as "studied today".
 *
 * The streak survives today being empty — it counts back from yesterday — so a
 * student doesn't watch it reset at midnight before they've had a chance.
 */
/**
 * Every calendar day this student did something themselves.
 *
 * Only their own actions count. Attendance is recorded BY a trainer, so it says
 * the class ran, not that the student studied — counting it would hand out
 * streaks nobody earned.
 */
/**
 * The current instant, read once per request.
 *
 * Reading the clock inside a component body counts as an impure call during
 * render; taking it from an awaited helper keeps render pure and gives the
 * whole page one consistent "now".
 */
export async function getNow() {
  const iso = new Date().toISOString();
  return { iso, day: localDay(iso), ms: Date.parse(iso) };
}

export async function getStudentActivityDays(userId: string) {
  const [subRows, attemptRows] = await Promise.all([
    loadSubmissions().then((r) => r.filter((x) => x.studentId === userId)),
    loadQuizAttempts().then((r) => r.filter((x) => x.studentId === userId)),
  ]);

  const day = (iso?: string | null) => (iso ? localDay(iso) : null);
  return new Set<string>(
    [
      ...subRows.flatMap((x) => [day(x.submittedAt), day(x.updatedAt)]),
      ...attemptRows.map((a) => day(a.submittedAt)),
    ].filter((d): d is string => Boolean(d))
  );
}

export async function getStudentStreak(userId: string) {
  const active = await getStudentActivityDays(userId);

  const iso = (d: Date) => localDay(d.toISOString());
  const today = new Date();
  const todayKey = iso(today);

  // Count back from today, or from yesterday if nothing has happened yet today.
  const cursor = new Date(today);
  if (!active.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  let current = 0;
  while (active.has(iso(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // The last seven days, oldest first, for the day-by-day strip.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()],
      date: iso(d),
      active: active.has(iso(d)),
      isToday: iso(d) === todayKey,
    };
  });

  return { current, studiedToday: active.has(todayKey), week, totalDays: active.size };
}

export type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  progress?: string;
};

/**
 * Achievements, all derived from existing records — nothing is stored, so a
 * badge can never drift out of step with the data behind it.
 */
export async function getStudentBadges(userId: string): Promise<Badge[]> {
  const [progressRows, subRows, attemptRows, nodeRows, streak] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    loadSubmissions().then((r) => r.filter((x) => x.studentId === userId)),
    loadQuizAttempts().then((r) => r.filter((x) => x.studentId === userId)),
    loadRoadmapNodes(),
    getStudentStreak(userId),
  ]);

  const completed = progressRows.filter((p) => p.completed).length;
  const approved = subRows.filter((s) => s.status === "approved").length;
  const perfectQuiz = attemptRows.some((a) => a.total > 0 && a.score === a.total);
  const passedQuiz = attemptRows.filter((a) => a.passed).length;

  // "Week 1" topics, matched on the week prefix the roadmap descriptions carry.
  const weekOneIds = nodeRows
    .filter((n) => /^week 1\b/i.test((n.description ?? "").split("·")[0].trim()))
    .map((n) => n.id);
  const weekOneDone =
    weekOneIds.length > 0 &&
    weekOneIds.every((id) => progressRows.some((p) => p.nodeId === id && p.completed));

  return [
    {
      id: "first-steps",
      label: "First Steps",
      description: "Complete your first topic",
      earned: completed >= 1,
      progress: `${Math.min(completed, 1)}/1`,
    },
    {
      id: "first-submission",
      label: "Handed In",
      description: "Submit your first assignment",
      earned: subRows.length >= 1,
      progress: `${Math.min(subRows.length, 1)}/1`,
    },
    {
      id: "week-one",
      label: "Week One Done",
      description: "Finish every Week 1 topic",
      earned: weekOneDone,
      progress: weekOneIds.length
        ? `${weekOneIds.filter((id) => progressRows.some((p) => p.nodeId === id && p.completed)).length}/${weekOneIds.length}`
        : undefined,
    },
    {
      id: "streak-7",
      label: "Seven Day Streak",
      description: "Study seven days running",
      earned: streak.current >= 7,
      progress: `${Math.min(streak.current, 7)}/7`,
    },
    {
      id: "quiz-ace",
      label: "Quiz Ace",
      description: "Score full marks on a quiz",
      earned: perfectQuiz,
      progress: passedQuiz ? `${passedQuiz} passed` : undefined,
    },
    {
      id: "ten-topics",
      label: "Getting Serious",
      description: "Complete ten topics",
      earned: completed >= 10,
      progress: `${Math.min(completed, 10)}/10`,
    },
    {
      id: "approved-three",
      label: "Trusted Work",
      description: "Get three assignments approved",
      earned: approved >= 3,
      progress: `${Math.min(approved, 3)}/3`,
    },
    {
      id: "halfway",
      label: "Halfway There",
      description: "Complete half the roadmap",
      earned: nodeRows.length > 0 && completed >= Math.ceil(nodeRows.length / 2),
      progress: nodeRows.length ? `${completed}/${Math.ceil(nodeRows.length / 2)}` : undefined,
    },
  ];
}

export async function getCertificateProgress(userId: string) {
  const batchId = await getUserBatchId(userId);
  const [attRows, everyAssignment, subRows, attemptRows] = await Promise.all([
    loadAttendance().then((r) => r.filter((x) => x.studentId === userId)),
    loadAssignments(),
    loadSubmissions().then((r) => r.filter((x) => x.studentId === userId)),
    loadQuizAttempts().then((r) => r.filter((x) => x.studentId === userId)),
  ]);
  // Only this student's batch counts — they can't submit work they never see.
  const assignmentRows = everyAssignment.filter((a) => visibleToBatch(a.batchId, batchId));

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
    loadUsers(),
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
        studentId: a.studentId,
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
  const [allQuizRows, attemptRows, batchId] = await Promise.all([
    db.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
    loadQuizAttempts().then((r) => r.filter((x) => x.studentId === studentId)),
    getUserBatchId(studentId),
  ]);
  const quizRows = allQuizRows.filter((q) => visibleToBatch(q.batchId, batchId));
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
      // Correct answers are released only to a student who has already used
      // their attempt, so they can see what they got wrong.
      review: attempt ? buildReview(questions, attempt.answers) : null,
    };
  });
}

/** Per-question breakdown: the options, the right one, and what was chosen. */
function buildReview(questions: { question: string; options: string[]; correctIndex: number }[], answersJson: string | null) {
  let answers: number[] = [];
  try {
    const parsed = JSON.parse(answersJson ?? "[]");
    if (Array.isArray(parsed)) answers = parsed;
  } catch {
    answers = [];
  }
  return questions.map((q, i) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    chosenIndex: typeof answers[i] === "number" ? answers[i] : -1,
    correct: answers[i] === q.correctIndex,
  }));
}

const rel = (iso?: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "";

/**
 * Recent events. Staff see activity across all students; a student sees ONLY
 * their own submissions/enrollments (plus course-wide announcements) — never
 * another student's data.
 */
export async function getRecentActivities(user?: { id: string; role: string }) {
  const isStudent = user?.role === "student";
  const [subRows, enrollRows, annRows, userRows, assignmentRows] = await Promise.all([
    // Same memoised table as the rest of the page; ordering and the limit move
    // in-memory so this costs no extra round trip.
    loadSubmissions().then((rows) =>
      rows
        .filter((x) => (isStudent ? x.studentId === user!.id : true))
        .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
        .slice(0, 5)
    ),
    isStudent
      ? db.select().from(enrollments).where(eq(enrollments.userId, user!.id)).orderBy(desc(enrollments.enrolledAt)).limit(5)
      : db.select().from(enrollments).orderBy(desc(enrollments.enrolledAt)).limit(5),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(5),
    loadUsers(),
    loadAssignments(),
  ]);

  const userName = (id: string) => userRows.find((u) => u.id === id)?.name ?? "Someone";
  const assignmentTitle = (id: string) => assignmentRows.find((a) => a.id === id)?.title ?? "an assignment";

  const events = [
    ...subRows.map((s) => ({
      id: `sub-${s.id}`,
      action: `${userName(s.studentId)} ${s.updatedAt ? "updated their submission for" : "submitted"} “${assignmentTitle(s.assignmentId)}”`,
      at: s.updatedAt ?? s.submittedAt,
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
    loadUsers().then((r) => r.filter((u) => u.role === "student")),
    loadRoadmapNodes(),
    loadAttendance(),
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

/** Batches with their student counts, for the management screen. */
export async function getBatchesWithCounts() {
  const [batchRows, studentRows] = await Promise.all([
    loadBatches(),
    db.select({ id: users.id, batchId: users.batchId }).from(users).where(eq(users.role, "student")),
  ]);

  return batchRows
    .map((b) => ({
      ...b,
      studentCount: studentRows.filter((u) => u.batchId === b.id).length,
    }))
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "") || a.name.localeCompare(b.name));
}

/** Students not yet placed in a batch — worth flagging, they see unscoped work only. */
export async function getUnassignedStudentCount() {
  const rows = await db
    .select({ batchId: users.batchId })
    .from(users)
    .where(eq(users.role, "student"));
  return rows.filter((u) => !u.batchId).length;
}

/**
 * The batch a student belongs to, or null for staff and unassigned students.
 * Content carrying a different batchId is hidden from them; content with no
 * batchId belongs to everyone.
 */
export const getUserBatchId = cache(async (userId: string) => {
  const row = (await loadUsers()).find((u) => u.id === userId);
  return row?.batchId ?? null;
});

/** True when a row scoped to `rowBatchId` should be visible to `batchId`. */
export function visibleToBatch(rowBatchId: string | null, batchId: string | null) {
  return !rowBatchId || rowBatchId === batchId;
}
