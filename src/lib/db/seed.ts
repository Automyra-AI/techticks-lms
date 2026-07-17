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
  certificates,
  lessonProgress,
} from "./schema";
import { hashPassword } from "../auth";

const now = () => new Date().toISOString();

type Status = "locked" | "completed" | "in_progress" | "not_started";
type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * AI Automation Mastery — clean course roadmap (8 weeks + final project).
 * One node per topic; each node carries its week label and the week's outcome.
 * No demo progress — every node starts at "not_started".
 */
const roadmap: {
  title: string;
  week: string;
  outcome: string;
  difficulty: Difficulty;
  duration: string;
}[] = [
  // Week 1 — Foundations · Outcome: Can read APIs & design simple flows
  { title: "Automation Mindset & Real Use-Cases", week: "Week 1 — Foundations", outcome: "Can read APIs & design simple flows", difficulty: "beginner", duration: "1.5 hours" },
  { title: "APIs, Webhooks & JSON", week: "Week 1 — Foundations", outcome: "Can read APIs & design simple flows", difficulty: "beginner", duration: "2 hours" },
  { title: "AI + Automation Ecosystem", week: "Week 1 — Foundations", outcome: "Can read APIs & design simple flows", difficulty: "beginner", duration: "1 hour" },

  // Week 2 — n8n Basics · Outcome: Build working n8n automations
  { title: "Nodes, Triggers & Workflows", week: "Week 2 — n8n Basics", outcome: "Build working n8n automations", difficulty: "beginner", duration: "2 hours" },
  { title: "Webhooks & HTTP Requests", week: "Week 2 — n8n Basics", outcome: "Build working n8n automations", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Credentials & Data Mapping", week: "Week 2 — n8n Basics", outcome: "Build working n8n automations", difficulty: "intermediate", duration: "1.5 hours" },

  // Week 3 — n8n Advanced · Outcome: Production-ready n8n systems
  { title: "Expressions, Loops & IFs", week: "Week 3 — n8n Advanced", outcome: "Production-ready n8n systems", difficulty: "intermediate", duration: "2 hours" },
  { title: "Error Handling & Retries", week: "Week 3 — n8n Advanced", outcome: "Production-ready n8n systems", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Sub-workflows & Self-Hosting", week: "Week 3 — n8n Advanced", outcome: "Production-ready n8n systems", difficulty: "advanced", duration: "2 hours" },

  // Week 4 — Zapier (Speed Automations) · Outcome: Fast client-delivery automations
  { title: "Triggers, Actions & Filters", week: "Week 4 — Zapier (Speed Automations)", outcome: "Fast client-delivery automations", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Webhooks by Zapier", week: "Week 4 — Zapier (Speed Automations)", outcome: "Fast client-delivery automations", difficulty: "intermediate", duration: "1 hour" },
  { title: "AI Actions (OpenAI)", week: "Week 4 — Zapier (Speed Automations)", outcome: "Fast client-delivery automations", difficulty: "advanced", duration: "2 hours" },

  // Week 5 — Make.com (Complex Logic) · Outcome: Handle complex SaaS workflows
  { title: "Routers, Iterators & Aggregators", week: "Week 5 — Make.com (Complex Logic)", outcome: "Handle complex SaaS workflows", difficulty: "intermediate", duration: "2 hours" },
  { title: "Advanced Scenarios & Optimization", week: "Week 5 — Make.com (Complex Logic)", outcome: "Handle complex SaaS workflows", difficulty: "advanced", duration: "2 hours" },

  // Week 6 — AI Integrations · Outcome: Smart AI-powered automations
  { title: "OpenAI / LLM APIs", week: "Week 6 — AI Integrations", outcome: "Smart AI-powered automations", difficulty: "advanced", duration: "2 hours" },
  { title: "Prompt Engineering for Workflows", week: "Week 6 — AI Integrations", outcome: "Smart AI-powered automations", difficulty: "advanced", duration: "1.5 hours" },
  { title: "AI Agents & Tool Usage", week: "Week 6 — AI Integrations", outcome: "Smart AI-powered automations", difficulty: "advanced", duration: "2.5 hours" },

  // Week 7 — Real-World Systems · Outcome: Client-ready systems
  { title: "Lead Gen + CRM", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "2 hours" },
  { title: "WhatsApp / Telegram Bots", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "2 hours" },
  { title: "Email + AI Follow-ups", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Payments & E-commerce", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "2 hours" },

  // Week 8 — Advanced + Career · Outcome: Ready for freelancing/agency work
  { title: "Multi-Tool Orchestration", week: "Week 8 — Advanced + Career", outcome: "Ready for freelancing/agency work", difficulty: "advanced", duration: "2 hours" },
  { title: "Security, Logs & Monitoring", week: "Week 8 — Advanced + Career", outcome: "Ready for freelancing/agency work", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Pricing, Proposals & Portfolio", week: "Week 8 — Advanced + Career", outcome: "Ready for freelancing/agency work", difficulty: "intermediate", duration: "1.5 hours" },

  // Final Project (Week 9–10) · Outcome: Client-style delivery
  { title: "Full AI Automation System", week: "Final Project (Week 9–10)", outcome: "Client-style delivery", difficulty: "advanced", duration: "8 hours" },
  { title: "Documentation + Demo", week: "Final Project (Week 9–10)", outcome: "Client-style delivery", difficulty: "advanced", duration: "3 hours" },
  { title: "Client-Style Delivery", week: "Final Project (Week 9–10)", outcome: "Client-style delivery", difficulty: "advanced", duration: "2 hours" },
];

/** Delete every row from every table, children before parents (FK-safe). */
async function clearAll() {
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
  console.log("🌱 Resetting TechTicks Academy database (removing all test/mock data)...");
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

  await db.insert(courses).values({
    id: courseId,
    title: "AI Automation Mastery",
    description:
      "Job-ready, hands-on program: automation foundations, n8n (basics → advanced), Zapier, Make.com, AI integrations, real-world client systems, career prep, and a final portfolio project.",
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

  await db.insert(roadmapNodes).values(
    roadmap.map((n, i) => ({
      id: uuid(),
      courseId,
      title: n.title,
      description: `${n.week} · Outcome: ${n.outcome}`,
      difficulty: n.difficulty,
      duration: n.duration,
      status: "not_started" as Status,
      orderIndex: i,
      positionX: 400,
      positionY: i * 170,
    }))
  );

  console.log(`✅ Reset complete. Inserted ${roadmap.length} roadmap nodes, 1 course, 3 accounts.`);
  console.log("\nLogin accounts (password: password123):");
  console.log("  Admin:   admin@techticks.com");
  console.log("  Trainer: trainer@techticks.com");
  console.log("  Student: student@techticks.com");
}

seed().catch(console.error);
