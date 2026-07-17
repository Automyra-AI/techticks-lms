import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "trainer", "student"] }).notNull(),
  avatar: text("avatar"),
  phone: text("phone"),
  github: text("github"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  enrollmentDate: text("enrollment_date"),
  createdAt: text("created_at").notNull(),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail"),
  trainerId: text("trainer_id").references(() => users.id),
  status: text("status", { enum: ["draft", "published", "archived"] }).default("published"),
  price: real("price").default(0),
  createdAt: text("created_at").notNull(),
});

export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  progress: real("progress").default(0),
  enrolledAt: text("enrolled_at").notNull(),
});

export const roadmapNodes = sqliteTable("roadmap_nodes", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).default("beginner"),
  duration: text("duration"),
  prerequisites: text("prerequisites"),
  status: text("status", { enum: ["locked", "completed", "in_progress", "not_started"] }).default("not_started"),
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"),
  notes: text("notes"),
  slidesUrl: text("slides_url"),
  githubUrl: text("github_url"),
  quizId: text("quiz_id"),
  assignmentId: text("assignment_id"),
  positionX: real("position_x").default(0),
  positionY: real("position_y").default(0),
});

export const weeks = sqliteTable("weeks", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  objectives: text("objectives"),
  progress: real("progress").default(0),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  weekId: text("week_id").references(() => weeks.id),
  courseId: text("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  slidesUrl: text("slides_url"),
  meetingUrl: text("meeting_url"),
  meetingPlatform: text("meeting_platform", { enum: ["zoom", "google_meet", "teams"] }),
  scheduledAt: text("scheduled_at"),
  duration: integer("duration"),
  recordingUrl: text("recording_url"),
  orderIndex: integer("order_index").default(0),
});

export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  weekId: text("week_id").references(() => weeks.id),
  nodeId: text("node_id").references(() => roadmapNodes.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  maxMarks: integer("max_marks").default(100),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium"),
  rubric: text("rubric"),
  submissionFormat: text("submission_format"),
  resources: text("resources"),
  // Optional assignment file: an external link (attachmentUrl) and/or an
  // uploaded file stored inline (attachmentData = base64, with name + mime type).
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  attachmentData: text("attachment_data"),
  createdAt: text("created_at").notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").references(() => assignments.id).notNull(),
  studentId: text("student_id").references(() => users.id).notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  // Directly uploaded submission file, stored inline (base64) with name + type.
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileData: text("file_data"),
  githubUrl: text("github_url"),
  driveUrl: text("drive_url"),
  status: text("status", { enum: ["pending", "approved", "revision_needed", "rejected", "late"] }).default("pending"),
  marks: integer("marks"),
  feedback: text("feedback"),
  remarks: text("remarks"),
  submittedAt: text("submitted_at").notNull(),
  reviewedAt: text("reviewed_at"),
});

export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => sessions.id).notNull(),
  studentId: text("student_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["present", "late", "absent", "excused"] }).notNull(),
  markedAt: text("marked_at").notNull(),
});

export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", {
    enum: ["videos", "pdfs", "slides", "templates", "github", "links", "prompts", "cheatsheets", "automation"],
  }).notNull(),
  url: text("url").notNull(),
  fileType: text("file_type"),
  createdAt: text("created_at").notNull(),
});

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id),
  authorId: text("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  courseId: text("course_id").references(() => courses.id),
  content: text("content").notNull(),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).default(false),
  link: text("link"),
  createdAt: text("created_at").notNull(),
});

export const weeklyRemarks = sqliteTable("weekly_remarks", {
  id: text("id").primaryKey(),
  weekId: text("week_id").references(() => weeks.id).notNull(),
  studentId: text("student_id").references(() => users.id).notNull(),
  trainerId: text("trainer_id").references(() => users.id).notNull(),
  remark: text("remark").notNull(),
  createdAt: text("created_at").notNull(),
});

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  nodeId: text("node_id").references(() => roadmapNodes.id),
  title: text("title").notNull(),
  questions: text("questions").notNull(),
  timeLimit: integer("time_limit"),
  passingScore: integer("passing_score").default(70),
  createdAt: text("created_at").notNull(),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").references(() => quizzes.id).notNull(),
  studentId: text("student_id").references(() => users.id).notNull(),
  answers: text("answers"), // JSON array of selected option indices
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  // How the attempt ended: completed | timeout | tab_switch
  reason: text("reason"),
  submittedAt: text("submitted_at").notNull(),
});

export const certificates = sqliteTable("certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  issuedAt: text("issued_at").notNull(),
  pdfUrl: text("pdf_url"),
});

export const lessonProgress = sqliteTable("lesson_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  nodeId: text("node_id").references(() => roadmapNodes.id).notNull(),
  progress: real("progress").default(0),
  completed: integer("completed", { mode: "boolean" }).default(false),
  updatedAt: text("updated_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type RoadmapNode = typeof roadmapNodes.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
