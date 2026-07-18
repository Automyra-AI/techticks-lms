import { v4 as uuid } from "uuid";

type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * The default AI Automation Mastery roadmap (8 weeks + final project),
 * from the course outline. Shared by the seed and the course-create API so
 * every course automatically gets a roadmap.
 */
export const DEFAULT_ROADMAP: {
  title: string;
  week: string;
  outcome: string;
  difficulty: Difficulty;
  duration: string;
}[] = [
  // Week 1 — Foundations
  { title: "Automation Mindset & Real Use-Cases", week: "Week 1 — Foundations", outcome: "Can read APIs & design simple flows", difficulty: "beginner", duration: "1.5 hours" },
  { title: "APIs, Webhooks & JSON", week: "Week 1 — Foundations", outcome: "Can read APIs & design simple flows", difficulty: "beginner", duration: "2 hours" },
  { title: "AI + Automation Ecosystem", week: "Week 1 — Foundations", outcome: "Can read APIs & design simple flows", difficulty: "beginner", duration: "1 hour" },

  // Week 2 — n8n Basics
  { title: "Nodes, Triggers & Workflows", week: "Week 2 — n8n Basics", outcome: "Build working n8n automations", difficulty: "beginner", duration: "2 hours" },
  { title: "Webhooks & HTTP Requests", week: "Week 2 — n8n Basics", outcome: "Build working n8n automations", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Credentials & Data Mapping", week: "Week 2 — n8n Basics", outcome: "Build working n8n automations", difficulty: "intermediate", duration: "1.5 hours" },

  // Week 3 — n8n Advanced
  { title: "Expressions, Loops & IFs", week: "Week 3 — n8n Advanced", outcome: "Production-ready n8n systems", difficulty: "intermediate", duration: "2 hours" },
  { title: "Error Handling & Retries", week: "Week 3 — n8n Advanced", outcome: "Production-ready n8n systems", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Sub-workflows & Self-Hosting", week: "Week 3 — n8n Advanced", outcome: "Production-ready n8n systems", difficulty: "advanced", duration: "2 hours" },

  // Week 4 — Zapier (Speed Automations)
  { title: "Triggers, Actions & Filters", week: "Week 4 — Zapier (Speed Automations)", outcome: "Fast client-delivery automations", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Webhooks by Zapier", week: "Week 4 — Zapier (Speed Automations)", outcome: "Fast client-delivery automations", difficulty: "intermediate", duration: "1 hour" },
  { title: "AI Actions (OpenAI)", week: "Week 4 — Zapier (Speed Automations)", outcome: "Fast client-delivery automations", difficulty: "advanced", duration: "2 hours" },

  // Week 5 — Make.com (Complex Logic)
  { title: "Routers, Iterators & Aggregators", week: "Week 5 — Make.com (Complex Logic)", outcome: "Handle complex SaaS workflows", difficulty: "intermediate", duration: "2 hours" },
  { title: "Advanced Scenarios & Optimization", week: "Week 5 — Make.com (Complex Logic)", outcome: "Handle complex SaaS workflows", difficulty: "advanced", duration: "2 hours" },

  // Week 6 — AI Integrations
  { title: "OpenAI / LLM APIs", week: "Week 6 — AI Integrations", outcome: "Smart AI-powered automations", difficulty: "advanced", duration: "2 hours" },
  { title: "Prompt Engineering for Workflows", week: "Week 6 — AI Integrations", outcome: "Smart AI-powered automations", difficulty: "advanced", duration: "1.5 hours" },
  { title: "AI Agents & Tool Usage", week: "Week 6 — AI Integrations", outcome: "Smart AI-powered automations", difficulty: "advanced", duration: "2.5 hours" },

  // Week 7 — Real-World Systems
  { title: "Lead Gen + CRM", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "2 hours" },
  { title: "WhatsApp / Telegram Bots", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "2 hours" },
  { title: "Email + AI Follow-ups", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Payments & E-commerce", week: "Week 7 — Real-World Systems", outcome: "Client-ready systems", difficulty: "advanced", duration: "2 hours" },

  // Week 8 — Advanced + Career
  { title: "Multi-Tool Orchestration", week: "Week 8 — Advanced + Career", outcome: "Ready for freelancing/agency work", difficulty: "advanced", duration: "2 hours" },
  { title: "Security, Logs & Monitoring", week: "Week 8 — Advanced + Career", outcome: "Ready for freelancing/agency work", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Pricing, Proposals & Portfolio", week: "Week 8 — Advanced + Career", outcome: "Ready for freelancing/agency work", difficulty: "intermediate", duration: "1.5 hours" },

  // Final Project (Week 9–10)
  { title: "Full AI Automation System", week: "Final Project (Week 9–10)", outcome: "Client-style delivery", difficulty: "advanced", duration: "8 hours" },
  { title: "Documentation + Demo", week: "Final Project (Week 9–10)", outcome: "Client-style delivery", difficulty: "advanced", duration: "3 hours" },
  { title: "Client-Style Delivery", week: "Final Project (Week 9–10)", outcome: "Client-style delivery", difficulty: "advanced", duration: "2 hours" },
];

/** Build roadmap_nodes insert rows for a given course. */
export function buildRoadmapNodes(courseId: string) {
  return DEFAULT_ROADMAP.map((n, i) => ({
    id: uuid(),
    courseId,
    title: n.title,
    description: `${n.week} · Outcome: ${n.outcome}`,
    difficulty: n.difficulty,
    duration: n.duration,
    status: "not_started" as const,
    orderIndex: i,
    positionX: 400,
    positionY: i * 170,
  }));
}
