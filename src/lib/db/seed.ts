import { v4 as uuid } from "uuid";
import { db } from "./index";
import {
  users,
  courses,
  enrollments,
  roadmapNodes,
  weeks,
  sessions,
  assignments,
  submissions,
  attendance,
  resources,
  announcements,
  messages,
  notifications,
  weeklyRemarks,
  quizzes,
  quizAttempts,
  certificates,
  lessonProgress,
} from "./schema";
import { hashPassword } from "../auth";
import { DEFAULT_ROADMAP, buildRoadmapNodes } from "./default-roadmap";

const now = () => new Date().toISOString();

/** Delete every row from every table, children before parents (FK-safe). */
async function clearAll() {
  await db.delete(quizAttempts);
  await db.delete(lessonProgress);
  await db.delete(certificates);
  await db.delete(quizzes);
  await db.delete(weeklyRemarks);
  await db.delete(notifications);
  await db.delete(messages);
  await db.delete(submissions);
  await db.delete(attendance);
  await db.delete(assignments);
  await db.delete(resources);
  await db.delete(announcements);
  await db.delete(sessions);
  await db.delete(weeks);
  await db.delete(enrollments);
  await db.delete(roadmapNodes);
  await db.delete(courses);
  await db.delete(users);
}

export async function seed() {
  console.log("🌱 Resetting TechTicks Academy database (removing all old/test data)...");
  await clearAll();

  const adminId = uuid();
  const trainerId = uuid();
  const studentId = uuid();
  const courseId = uuid();
  const password = await hashPassword("password123");

  // Minimal login accounts — no public signup exists, so at least an admin is required.
  await db.insert(users).values([
    { id: adminId, email: "admin@techticks.com", password, name: "Admin", role: "admin", createdAt: now() },
    { id: trainerId, email: "trainer@techticks.com", password, name: "Trainer", role: "trainer", createdAt: now() },
    { id: studentId, email: "student@techticks.com", password, name: "Student", role: "student", createdAt: now() },
  ]);

  // The single AI Automation course + its roadmap. Everything else (assignments,
  // quizzes, attendance, resources) is intentionally empty — the team adds it later.
  await db.insert(courses).values({
    id: courseId,
    title: "Ai Automation",
    description: "In this course you will learn about AI automation from basic level to advance.",
    trainerId,
    status: "published",
    createdAt: now(),
  });

  await db.insert(enrollments).values({
    id: uuid(),
    userId: studentId,
    courseId,
    progress: 0,
    enrolledAt: now(),
  });

  await db.insert(roadmapNodes).values(buildRoadmapNodes(courseId));

  console.log(`✅ Reset complete. Inserted ${DEFAULT_ROADMAP.length} roadmap nodes, 1 course, 3 accounts.`);
  console.log("\nLogin accounts (password: password123):");
  console.log("  Admin:   admin@techticks.com");
  console.log("  Trainer: trainer@techticks.com");
  console.log("  Student: student@techticks.com");
}

seed().catch(console.error);
