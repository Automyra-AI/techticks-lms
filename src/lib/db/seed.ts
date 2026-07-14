import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
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
  notifications,
  weeklyRemarks,
  lessonProgress,
} from "./schema";
import { hashPassword } from "../auth";

const now = () => new Date().toISOString();

export async function seed() {
  console.log("🌱 Seeding TechTicks Academy database...");

  const [existingUser] = await db.select().from(users).where(eq(users.email, "admin@techticks.com")).limit(1);
  if (existingUser) {
    console.log("✅ Database already seeded. Skipping.");
    console.log("\nDemo accounts (password: password123):");
    console.log("  Admin:   admin@techticks.com");
    console.log("  Trainer: trainer@techticks.com");
    console.log("  Student: student@techticks.com");
    return;
  }

  const adminId = uuid();
  const trainerId = uuid();
  const studentId = uuid();
  const student2Id = uuid();
  const courseId = uuid();

  const password = await hashPassword("password123");

  await db.insert(users).values([
    {
      id: adminId,
      email: "admin@techticks.com",
      password,
      name: "Admin User",
      role: "admin",
      createdAt: now(),
    },
    {
      id: trainerId,
      email: "trainer@techticks.com",
      password,
      name: "Sarah Ahmed",
      role: "trainer",
      phone: "+92 300 1234567",
      github: "https://github.com/sarahahmed",
      createdAt: now(),
    },
    {
      id: studentId,
      email: "student@techticks.com",
      password,
      name: "Hamza Khan",
      role: "student",
      phone: "+92 321 9876543",
      github: "https://github.com/hamzakhan",
      linkedin: "https://linkedin.com/in/hamzakhan",
      enrollmentDate: "2026-01-15",
      createdAt: now(),
    },
    {
      id: student2Id,
      email: "ali@techticks.com",
      password,
      name: "Ali Hassan",
      role: "student",
      enrollmentDate: "2026-02-01",
      createdAt: now(),
    },
  ]);

  await db.insert(courses).values({
    id: courseId,
    title: "AI Automation Mastery",
    description:
      "Complete course covering Python, APIs, n8n, OpenAI, AI Agents, RAG, and real-world automation projects.",
    thumbnail: "/course-thumb.jpg",
    trainerId,
    status: "published",
    price: 499,
    createdAt: now(),
  });

  await db.insert(enrollments).values([
    { id: uuid(), userId: studentId, courseId, progress: 72, enrolledAt: "2026-01-15" },
    { id: uuid(), userId: student2Id, courseId, progress: 45, enrolledAt: "2026-02-01" },
  ]);

  const roadmapData = [
    { title: "Introduction", description: "Welcome to AI Automation Academy", difficulty: "beginner" as const, duration: "30 min", status: "completed" as const },
    { title: "Python Fundamentals", description: "Core Python concepts for automation", difficulty: "beginner" as const, duration: "2 hours", status: "completed" as const },
    { title: "Variables", description: "Data types and variable management", difficulty: "beginner" as const, duration: "45 min", status: "completed" as const },
    { title: "Functions", description: "Creating reusable code blocks", difficulty: "beginner" as const, duration: "1 hour", status: "completed" as const },
    { title: "Loops", description: "Iteration and automation patterns", difficulty: "beginner" as const, duration: "1 hour", status: "completed" as const },
    { title: "File Handling", description: "Reading and writing files", difficulty: "intermediate" as const, duration: "1.5 hours", status: "completed" as const },
    { title: "APIs", description: "Understanding API concepts", difficulty: "intermediate" as const, duration: "2 hours", status: "in_progress" as const },
    { title: "REST APIs", description: "HTTP methods and RESTful design", difficulty: "intermediate" as const, duration: "2 hours", status: "in_progress" as const },
    { title: "JSON", description: "Working with JSON data", difficulty: "intermediate" as const, duration: "1 hour", status: "not_started" as const },
    { title: "Automation Basics", description: "Introduction to workflow automation", difficulty: "intermediate" as const, duration: "1.5 hours", status: "not_started" as const },
    { title: "n8n Installation", description: "Setting up n8n locally and cloud", difficulty: "intermediate" as const, duration: "1 hour", status: "not_started" as const },
    { title: "Triggers", description: "Webhook, schedule, and event triggers", difficulty: "intermediate" as const, duration: "2 hours", status: "not_started" as const },
    { title: "Nodes", description: "Working with n8n nodes", difficulty: "intermediate" as const, duration: "2 hours", status: "not_started" as const },
    { title: "OpenAI Integration", description: "Connecting OpenAI to workflows", difficulty: "advanced" as const, duration: "2 hours", status: "locked" as const },
    { title: "Google Sheets", description: "Automating spreadsheet workflows", difficulty: "intermediate" as const, duration: "1.5 hours", status: "locked" as const },
    { title: "Telegram", description: "Building Telegram bots", difficulty: "intermediate" as const, duration: "2 hours", status: "locked" as const },
    { title: "WhatsApp", description: "WhatsApp Business automation", difficulty: "advanced" as const, duration: "2 hours", status: "locked" as const },
    { title: "AI Agents", description: "Building autonomous AI agents", difficulty: "advanced" as const, duration: "3 hours", status: "locked" as const },
    { title: "Memory", description: "Agent memory and context management", difficulty: "advanced" as const, duration: "2 hours", status: "locked" as const },
    { title: "RAG", description: "Retrieval Augmented Generation", difficulty: "advanced" as const, duration: "3 hours", status: "locked" as const },
    { title: "Vector Databases", description: "Pinecone, Chroma, and embeddings", difficulty: "advanced" as const, duration: "2 hours", status: "locked" as const },
    { title: "Final Automation Project", description: "Build a complete automation solution", difficulty: "advanced" as const, duration: "8 hours", status: "locked" as const },
    { title: "Portfolio Building", description: "Showcase your automation projects", difficulty: "intermediate" as const, duration: "2 hours", status: "locked" as const },
    { title: "Certificate", description: "Course completion certificate", difficulty: "beginner" as const, duration: "15 min", status: "locked" as const },
  ];

  const nodeIds = roadmapData.map(() => uuid());

  await db.insert(roadmapNodes).values(
    roadmapData.map((node, index) => ({
      id: nodeIds[index],
      courseId,
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      duration: node.duration,
      status: node.status,
      orderIndex: index,
      positionX: 400,
      positionY: index * 180,
      githubUrl: index > 0 ? `https://github.com/techticks/${node.title.toLowerCase().replace(/\s+/g, "-")}` : undefined,
    }))
  );

  const weekIds = [uuid(), uuid(), uuid(), uuid()];
  await db.insert(weeks).values([
    { id: weekIds[0], courseId, weekNumber: 1, title: "Python Foundations", objectives: "Learn Python basics, variables, functions, and loops", progress: 100 },
    { id: weekIds[1], courseId, weekNumber: 2, title: "APIs & Data", objectives: "Master APIs, REST, and JSON handling", progress: 80 },
    { id: weekIds[2], courseId, weekNumber: 3, title: "n8n Automation", objectives: "Build workflows with n8n triggers and nodes", progress: 30 },
    { id: weekIds[3], courseId, weekNumber: 4, title: "AI Integration", objectives: "OpenAI, agents, RAG, and final project", progress: 0 },
  ]);

  const sessionIds = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
  await db.insert(sessions).values([
    { id: sessionIds[0], weekId: weekIds[0], courseId, title: "Python Setup & Basics", description: "Environment setup and first script", meetingPlatform: "zoom", scheduledAt: "2026-01-20T10:00:00Z", duration: 90, orderIndex: 0 },
    { id: sessionIds[1], weekId: weekIds[0], courseId, title: "Functions & Loops", description: "Deep dive into functions and iteration", meetingPlatform: "zoom", scheduledAt: "2026-01-22T10:00:00Z", duration: 90, orderIndex: 1 },
    { id: sessionIds[2], weekId: weekIds[1], courseId, title: "Python APIs", description: "Making API calls with Python", meetingPlatform: "google_meet", scheduledAt: "2026-01-27T10:00:00Z", duration: 120, orderIndex: 0 },
    { id: sessionIds[3], weekId: weekIds[1], courseId, title: "REST API Practice", description: "Live coding REST API integration", meetingPlatform: "zoom", scheduledAt: "2026-01-29T10:00:00Z", duration: 120, orderIndex: 1 },
    { id: sessionIds[4], weekId: weekIds[2], courseId, title: "n8n Introduction", description: "First workflow in n8n", meetingPlatform: "zoom", scheduledAt: "2026-02-03T10:00:00Z", duration: 90, orderIndex: 0 },
    { id: sessionIds[5], weekId: weekIds[2], courseId, title: "Mini Project", description: "Build an automation mini project", meetingPlatform: "zoom", scheduledAt: "2026-02-05T10:00:00Z", duration: 120, orderIndex: 1 },
  ]);

  const assignmentIds = [uuid(), uuid(), uuid(), uuid()];
  await db.insert(assignments).values([
    { id: assignmentIds[0], courseId, weekId: weekIds[0], title: "Python Basics Homework", description: "Complete 10 Python exercises", dueDate: "2026-01-25", maxMarks: 100, difficulty: "easy", submissionFormat: "GitHub Link", createdAt: now() },
    { id: assignmentIds[1], courseId, weekId: weekIds[1], title: "REST API Integration", description: "Build a weather API integration", dueDate: "2026-02-01", maxMarks: 100, difficulty: "medium", submissionFormat: "GitHub Link + ZIP", createdAt: now() },
    { id: assignmentIds[2], courseId, weekId: weekIds[2], title: "n8n Workflow Project", description: "Create an automated email workflow", dueDate: "2026-02-10", maxMarks: 100, difficulty: "medium", submissionFormat: "n8n JSON Export", createdAt: now() },
    { id: assignmentIds[3], courseId, weekId: weekIds[3], title: "Final Automation Project", description: "Complete end-to-end automation with AI", dueDate: "2026-03-01", maxMarks: 200, difficulty: "hard", submissionFormat: "GitHub + Demo Video", createdAt: now() },
  ]);

  await db.insert(submissions).values([
    { id: uuid(), assignmentId: assignmentIds[0], studentId, content: "Completed all exercises", githubUrl: "https://github.com/hamzakhan/python-basics", status: "approved", marks: 95, feedback: "Excellent work! Clean code and good documentation.", submittedAt: "2026-01-24", reviewedAt: now() },
    { id: uuid(), assignmentId: assignmentIds[1], studentId, githubUrl: "https://github.com/hamzakhan/weather-api", status: "revision_needed", marks: 70, feedback: "Good start but error handling needs improvement.", submittedAt: "2026-01-30", reviewedAt: now() },
    { id: uuid(), assignmentId: assignmentIds[0], studentId: student2Id, githubUrl: "https://github.com/ali/python-hw", status: "approved", marks: 88, feedback: "Well done!", submittedAt: "2026-01-26", reviewedAt: now() },
  ]);

  await db.insert(attendance).values([
    { id: uuid(), sessionId: sessionIds[0], studentId, status: "present", markedAt: now() },
    { id: uuid(), sessionId: sessionIds[1], studentId, status: "present", markedAt: now() },
    { id: uuid(), sessionId: sessionIds[2], studentId, status: "late", markedAt: now() },
    { id: uuid(), sessionId: sessionIds[3], studentId, status: "present", markedAt: now() },
    { id: uuid(), sessionId: sessionIds[0], studentId: student2Id, status: "present", markedAt: now() },
    { id: uuid(), sessionId: sessionIds[1], studentId: student2Id, status: "absent", markedAt: now() },
  ]);

  await db.insert(resources).values([
    { id: uuid(), courseId, title: "Python Cheat Sheet", category: "cheatsheets", url: "#", fileType: "pdf", createdAt: now() },
    { id: uuid(), courseId, title: "n8n Workflow Templates", category: "automation", url: "#", fileType: "json", createdAt: now() },
    { id: uuid(), courseId, title: "OpenAI Prompt Library", category: "prompts", url: "#", createdAt: now() },
    { id: uuid(), courseId, title: "API Integration Guide", category: "pdfs", url: "#", fileType: "pdf", createdAt: now() },
    { id: uuid(), courseId, title: "Starter GitHub Repo", category: "github", url: "https://github.com/techticks/starter", createdAt: now() },
  ]);

  await db.insert(announcements).values([
    { id: uuid(), courseId, authorId: trainerId, title: "Week 3 Starts Monday!", content: "Get ready for n8n automation week. Install n8n before the session.", createdAt: now() },
    { id: uuid(), courseId, authorId: adminId, title: "New AI Features Coming", content: "We're adding AI assignment review and AI quiz generator soon!", createdAt: now() },
  ]);

  await db.insert(notifications).values([
    { id: uuid(), userId: studentId, type: "assignment_reviewed", title: "Assignment Reviewed", message: "Your REST API assignment has feedback.", read: false, link: "/assignments", createdAt: now() },
    { id: uuid(), userId: studentId, type: "session", title: "Upcoming Session", message: "n8n Introduction session tomorrow at 10 AM", read: false, link: "/calendar", createdAt: now() },
  ]);

  await db.insert(weeklyRemarks).values([
    { id: uuid(), weekId: weekIds[0], studentId, trainerId, remark: "Excellent progress! Keep practicing functions.", createdAt: now() },
    { id: uuid(), weekId: weekIds[1], studentId, trainerId, remark: "Good API work. Practice error handling more.", createdAt: now() },
  ]);

  for (let i = 0; i < 6; i++) {
    await db.insert(lessonProgress).values({
      id: uuid(),
      userId: studentId,
      nodeId: nodeIds[i],
      progress: 100,
      completed: true,
      updatedAt: now(),
    });
  }

  await db.insert(lessonProgress).values([
    { id: uuid(), userId: studentId, nodeId: nodeIds[6], progress: 60, completed: false, updatedAt: now() },
    { id: uuid(), userId: studentId, nodeId: nodeIds[7], progress: 30, completed: false, updatedAt: now() },
  ]);

  console.log("✅ Seed complete!");
  console.log("\nDemo accounts (password: password123):");
  console.log("  Admin:   admin@techticks.com");
  console.log("  Trainer: trainer@techticks.com");
  console.log("  Student: student@techticks.com");
}

seed().catch(console.error);
