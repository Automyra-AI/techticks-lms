/**
 * Replaces the course roadmap with the TechTicks 8-week AI Automation outline.
 * Safe to re-run: it clears the existing nodes (and their progress) for the
 * course, then re-inserts the outline below.
 *
 *   npx tsx --env-file=.env.local src/lib/db/reseed-roadmap.ts
 */
import { v4 as uuid } from "uuid";
import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  courses,
  roadmapNodes,
  lessonProgress,
  quizzes,
  assignments,
  users,
} from "./schema";

type Status = "locked" | "completed" | "in_progress" | "not_started";
type Difficulty = "beginner" | "intermediate" | "advanced";

const outline: {
  title: string;
  description: string;
  week: number;
  difficulty: Difficulty;
  duration: string;
  status: Status;
  videoUrl?: string;
  slidesUrl?: string;
  githubUrl?: string;
}[] = [
  // Week 1 — AI & Automation Fundamentals
  { title: "Course Introduction", description: "Week 1 · Welcome to the AI Automation Academy and how the program works", week: 1, difficulty: "beginner", duration: "30 min", status: "completed", videoUrl: "https://www.youtube.com/watch?v=nYh-n7EOtMA", slidesUrl: "https://techticks.academy/notes/intro" },
  { title: "What is AI Automation?", description: "Week 1 · AI vs automation, real-world examples, and businesses using it", week: 1, difficulty: "beginner", duration: "1 hour", status: "completed", slidesUrl: "https://techticks.academy/notes/ai-automation" },
  { title: "Understanding LLMs", description: "Week 1 · ChatGPT, Claude, Gemini — when to use each, free vs paid", week: 1, difficulty: "beginner", duration: "1 hour", status: "completed", slidesUrl: "https://techticks.academy/notes/llms" },
  { title: "Prompt Engineering Basics", description: "Week 1 · Anatomy of a good prompt, role & context prompting, templates", week: 1, difficulty: "beginner", duration: "1.5 hours", status: "completed", githubUrl: "https://github.com/techticks/prompt-templates" },
  { title: "Productivity with AI", description: "Week 1 · AI for emails, docs, reports, presentations, and research", week: 1, difficulty: "beginner", duration: "1.5 hours", status: "in_progress", slidesUrl: "https://techticks.academy/notes/productivity" },

  // Week 2 — n8n Fundamentals
  { title: "n8n Introduction", description: "Week 2 · What is n8n, cloud vs self-hosted, interface overview", week: 2, difficulty: "intermediate", duration: "1 hour", status: "in_progress", videoUrl: "https://www.youtube.com/watch?v=1MwSoB0gnM4", githubUrl: "https://github.com/techticks/n8n-starter" },
  { title: "n8n Core Concepts", description: "Week 2 · Nodes, connections, executions, credentials, variables, expressions", week: 2, difficulty: "intermediate", duration: "2 hours", status: "not_started" },
  { title: "Data Handling & JSON", description: "Week 2 · JSON basics, input & output, item lists, and the Merge node", week: 2, difficulty: "intermediate", duration: "1.5 hours", status: "not_started" },
  { title: "Core Nodes", description: "Week 2 · Set, Edit Fields, IF, Switch, Merge, HTTP Request, and Webhook", week: 2, difficulty: "intermediate", duration: "2 hours", status: "not_started" },
  { title: "n8n Automation Examples", description: "Week 2 · Build a Gmail, Google Sheets, Telegram, and Slack automation", week: 2, difficulty: "intermediate", duration: "2 hours", status: "not_started", githubUrl: "https://github.com/techticks/n8n-examples" },

  // Week 3 — Make.com Fundamentals
  { title: "Make.com Introduction", description: "Week 3 · Interface, scenarios, modules, and connections", week: 3, difficulty: "intermediate", duration: "1 hour", status: "not_started" },
  { title: "Data Processing in Make", description: "Week 3 · Variables, routers, filters, iterators, and aggregators", week: 3, difficulty: "intermediate", duration: "2 hours", status: "not_started" },
  { title: "Popular Integrations", description: "Week 3 · Gmail, Google Sheets, OpenAI, Discord, and Slack", week: 3, difficulty: "intermediate", duration: "1.5 hours", status: "not_started" },
  { title: "Error Handling & Scheduling", description: "Week 3 · Robust scenarios with error handling and scheduled runs", week: 3, difficulty: "intermediate", duration: "1.5 hours", status: "not_started" },

  // Week 4 — Zapier Fundamentals
  { title: "Zapier Introduction", description: "Week 4 · Dashboard, Zaps, triggers, and actions", week: 4, difficulty: "intermediate", duration: "1 hour", status: "not_started" },
  { title: "Multi-Step Zaps & Paths", description: "Week 4 · Multi-step Zaps, Paths, and branching logic", week: 4, difficulty: "intermediate", duration: "1.5 hours", status: "not_started" },
  { title: "Formatter, Tables & Interfaces", description: "Week 4 · Formatter, Tables, and Interfaces for full workflows", week: 4, difficulty: "intermediate", duration: "1.5 hours", status: "not_started" },
  { title: "Zapier AI Features", description: "Week 4 · Zapier AI, AI Actions, and AI Chatbots", week: 4, difficulty: "advanced", duration: "2 hours", status: "not_started" },

  // Week 5 — Combining AI + Automation
  { title: "OpenAI Integration", description: "Week 5 · Connecting ChatGPT, API keys, and AI nodes", week: 5, difficulty: "advanced", duration: "2 hours", status: "locked", githubUrl: "https://github.com/techticks/openai-automation" },
  { title: "Claude & Gemini Integration", description: "Week 5 · Adding Claude and Gemini to your automations", week: 5, difficulty: "advanced", duration: "1.5 hours", status: "locked" },
  { title: "Business Automations", description: "Week 5 · HR, marketing, customer support, CRM, and sales automations", week: 5, difficulty: "advanced", duration: "3 hours", status: "locked" },
  { title: "Automation Best Practices", description: "Week 5 · Naming, testing, error handling, logging, reusable templates", week: 5, difficulty: "intermediate", duration: "1 hour", status: "locked" },

  // Week 6 — Practice Week 1
  { title: "Practice Week 1 — AI Workflows", description: "Week 6 · Build email reply, blog generator, meeting notes, translator & summarizer", week: 6, difficulty: "advanced", duration: "6 hours", status: "locked", githubUrl: "https://github.com/techticks/practice-week-1" },

  // Week 7 — Practice Week 2
  { title: "Practice Week 2 — Business Automation", description: "Week 7 · Support automation, lead qualification, CRM, FAQ bot, resume & invoice readers", week: 7, difficulty: "advanced", duration: "6 hours", status: "locked", githubUrl: "https://github.com/techticks/practice-week-2" },

  // Week 8 — Final Project
  { title: "Final Project", description: "Week 8 · Ship one complete automation with working demo, docs, and portfolio assets", week: 8, difficulty: "advanced", duration: "8 hours", status: "locked" },
  { title: "Certificate", description: "Week 8 · Earn your AI Automation Mastery certificate", week: 8, difficulty: "beginner", duration: "15 min", status: "locked" },
];

async function main() {
  const [course] = await db.select().from(courses).limit(1);
  if (!course) {
    console.error("No course found. Run `npm run db:seed` first.");
    return;
  }
  console.log(`Reseeding roadmap for course: ${course.title} (${course.id})`);

  // Refresh course metadata to match the outline.
  await db
    .update(courses)
    .set({
      title: "AI Automation Mastery — 8 Week Program",
      description:
        "An 8-week hands-on program: AI & automation fundamentals, n8n, Make.com, Zapier, combining AI with automation, two practice weeks, and a final portfolio project.",
    })
    .where(eq(courses.id, course.id));

  // Clear existing nodes for this course, respecting foreign keys.
  const existing = await db
    .select({ id: roadmapNodes.id })
    .from(roadmapNodes)
    .where(eq(roadmapNodes.courseId, course.id));
  const ids = existing.map((n) => n.id);

  if (ids.length) {
    await db.delete(lessonProgress).where(inArray(lessonProgress.nodeId, ids));
    await db.delete(quizzes).where(inArray(quizzes.nodeId, ids));
    // Detach any assignments pinned to these nodes so we don't violate the FK.
    for (const id of ids) {
      await db.update(assignments).set({ nodeId: null }).where(eq(assignments.nodeId, id));
    }
    await db.delete(roadmapNodes).where(eq(roadmapNodes.courseId, course.id));
    console.log(`Removed ${ids.length} old roadmap nodes.`);
  }

  const nodeIds = outline.map(() => uuid());
  await db.insert(roadmapNodes).values(
    outline.map((n, i) => ({
      id: nodeIds[i],
      courseId: course.id,
      title: n.title,
      description: n.description,
      difficulty: n.difficulty,
      duration: n.duration,
      status: n.status,
      orderIndex: i,
      positionX: 400,
      positionY: i * 170,
      videoUrl: n.videoUrl ?? null,
      slidesUrl: n.slidesUrl ?? null,
      githubUrl: n.githubUrl ?? null,
    }))
  );
  console.log(`Inserted ${outline.length} roadmap nodes from the outline.`);

  // Re-seed lesson progress for the demo student on completed/in-progress nodes.
  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.email, "student@techticks.com"))
    .limit(1);
  if (student) {
    for (let i = 0; i < outline.length; i++) {
      const s = outline[i].status;
      if (s === "completed" || s === "in_progress") {
        await db.insert(lessonProgress).values({
          id: uuid(),
          userId: student.id,
          nodeId: nodeIds[i],
          progress: s === "completed" ? 100 : 45,
          completed: s === "completed",
          updatedAt: new Date().toISOString(),
        });
      }
    }
    console.log("Re-seeded lesson progress for demo student.");
  }

  console.log("✅ Roadmap reseed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
