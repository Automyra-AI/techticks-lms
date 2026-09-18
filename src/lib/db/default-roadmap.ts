import { v4 as uuid } from "uuid";

type Difficulty = "beginner" | "intermediate" | "advanced";

/**
 * The default AI Automation Bootcamp roadmap — 11 weeks, Basic → Intermediate →
 * Advanced, taken from the course outline (weeks 1–9 plus the two-week
 * freelancing block). Shared by the seed and the course-create API so every
 * course automatically gets a roadmap.
 */
export const DEFAULT_ROADMAP: {
  title: string;
  week: string;
  outcome: string;
  difficulty: Difficulty;
  duration: string;
}[] = [
  // Week 1 — Foundations of AI Automation
  { title: "Automation Mindset & Real-World Use Cases", week: "Week 1 — Foundations of AI Automation", outcome: "Read any API doc, test endpoints in Postman, and design flows on paper", difficulty: "beginner", duration: "1.5 hours" },
  { title: "How APIs Work: Endpoints, Methods & Auth", week: "Week 1 — Foundations of AI Automation", outcome: "Read any API doc, test endpoints in Postman, and design flows on paper", difficulty: "beginner", duration: "2 hours" },
  { title: "Webhooks vs Polling & JSON Deep Dive", week: "Week 1 — Foundations of AI Automation", outcome: "Read any API doc, test endpoints in Postman, and design flows on paper", difficulty: "beginner", duration: "2 hours" },
  { title: "Postman & the n8n / Make / Zapier Ecosystem Map", week: "Week 1 — Foundations of AI Automation", outcome: "Read any API doc, test endpoints in Postman, and design flows on paper", difficulty: "beginner", duration: "1.5 hours" },

  // Week 2 — n8n Basics
  { title: "n8n Setup: Cloud vs Self-Hosted & Workspace Tour", week: "Week 2 — n8n Basics", outcome: "Build n8n automations that trigger on real events and move clean data", difficulty: "beginner", duration: "1.5 hours" },
  { title: "Triggers: Manual, Schedule/Cron & Webhook Node", week: "Week 2 — n8n Basics", outcome: "Build n8n automations that trigger on real events and move clean data", difficulty: "beginner", duration: "1.5 hours" },
  { title: "Core Nodes, Credentials & Data Mapping", week: "Week 2 — n8n Basics", outcome: "Build n8n automations that trigger on real events and move clean data", difficulty: "intermediate", duration: "2 hours" },
  { title: "Build: Form → Google Sheets → Email/Slack Alert", week: "Week 2 — n8n Basics", outcome: "Build n8n automations that trigger on real events and move clean data", difficulty: "intermediate", duration: "2 hours" },

  // Week 3 — n8n Advanced
  { title: "Advanced Expressions & the Code Node", week: "Week 3 — n8n Advanced", outcome: "Design production-ready n8n systems that fail gracefully and scale", difficulty: "intermediate", duration: "2 hours" },
  { title: "Branching Logic: IF, Switch, Filter, Merge & Loops", week: "Week 3 — n8n Advanced", outcome: "Design production-ready n8n systems that fail gracefully and scale", difficulty: "intermediate", duration: "2 hours" },
  { title: "Error Handling, Retries & Failure Alerts", week: "Week 3 — n8n Advanced", outcome: "Design production-ready n8n systems that fail gracefully and scale", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Sub-Workflows, Rate Limits & Idempotency", week: "Week 3 — n8n Advanced", outcome: "Design production-ready n8n systems that fail gracefully and scale", difficulty: "advanced", duration: "2 hours" },
  { title: "Self-Hosting: Docker, Env Vars, Queue Mode & Backups", week: "Week 3 — n8n Advanced", outcome: "Design production-ready n8n systems that fail gracefully and scale", difficulty: "advanced", duration: "2 hours" },

  // Week 4 — Zapier
  { title: "Zap Anatomy: Triggers, Actions & Multi-Step Zaps", week: "Week 4 — Zapier (Fast, Client-Ready)", outcome: "Deliver reliable Zapier automations within a single working day", difficulty: "beginner", duration: "1.5 hours" },
  { title: "Filters, Paths & Formatter by Zapier", week: "Week 4 — Zapier (Fast, Client-Ready)", outcome: "Deliver reliable Zapier automations within a single working day", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Webhooks by Zapier, Tables & Interfaces", week: "Week 4 — Zapier (Fast, Client-Ready)", outcome: "Deliver reliable Zapier automations within a single working day", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Build: Lead Capture → CRM → Slack → Auto-Reply", week: "Week 4 — Zapier (Fast, Client-Ready)", outcome: "Deliver reliable Zapier automations within a single working day", difficulty: "intermediate", duration: "2 hours" },

  // Week 5 — Make.com
  { title: "Scenarios, Modules & Bundles", week: "Week 5 — Make.com (Complex Logic)", outcome: "Ship complex, multi-branch SaaS workflows in Make", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Routers, Iterators & Aggregators", week: "Week 5 — Make.com (Complex Logic)", outcome: "Ship complex, multi-branch SaaS workflows in Make", difficulty: "intermediate", duration: "2 hours" },
  { title: "Functions, Data Stores & Error Handlers", week: "Week 5 — Make.com (Complex Logic)", outcome: "Ship complex, multi-branch SaaS workflows in Make", difficulty: "advanced", duration: "2 hours" },
  { title: "Operation-Cost Optimisation & Make vs n8n vs Zapier", week: "Week 5 — Make.com (Complex Logic)", outcome: "Ship complex, multi-branch SaaS workflows in Make", difficulty: "advanced", duration: "1.5 hours" },

  // Week 6 — AI, GPT & LLM Integrations
  { title: "OpenAI & LLM APIs Inside Workflows", week: "Week 6 — AI, GPT & LLM Integrations", outcome: "Build AI automations that understand and decide, not just move data", difficulty: "advanced", duration: "2 hours" },
  { title: "Prompt Engineering for Automation", week: "Week 6 — AI, GPT & LLM Integrations", outcome: "Build AI automations that understand and decide, not just move data", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Structured JSON Output & Safe Parsing", week: "Week 6 — AI, GPT & LLM Integrations", outcome: "Build AI automations that understand and decide, not just move data", difficulty: "advanced", duration: "1.5 hours" },
  { title: "AI Tasks: Classification, Summarisation & Enrichment", week: "Week 6 — AI, GPT & LLM Integrations", outcome: "Build AI automations that understand and decide, not just move data", difficulty: "advanced", duration: "2 hours" },
  { title: "Embeddings, Vector Stores & RAG Knowledge Bases", week: "Week 6 — AI, GPT & LLM Integrations", outcome: "Build AI automations that understand and decide, not just move data", difficulty: "advanced", duration: "2.5 hours" },
  { title: "Token Cost, Caching & Handling Hallucinations", week: "Week 6 — AI, GPT & LLM Integrations", outcome: "Build AI automations that understand and decide, not just move data", difficulty: "advanced", duration: "1.5 hours" },

  // Week 7 — AI Agents & AI Chatbots
  { title: "AI Agents: Reasoning Loop, Tools & Memory", week: "Week 7 — AI Agents & Chatbots", outcome: "Ship chatbots and agents that handle real customer conversations", difficulty: "advanced", duration: "2 hours" },
  { title: "Building Agents in n8n with Tool Calling", week: "Week 7 — AI Agents & Chatbots", outcome: "Ship chatbots and agents that handle real customer conversations", difficulty: "advanced", duration: "2 hours" },
  { title: "WhatsApp Bots: Cloud API, Webhooks & Templates", week: "Week 7 — AI Agents & Chatbots", outcome: "Ship chatbots and agents that handle real customer conversations", difficulty: "advanced", duration: "2 hours" },
  { title: "Telegram & Slack Bots: Commands and Events", week: "Week 7 — AI Agents & Chatbots", outcome: "Ship chatbots and agents that handle real customer conversations", difficulty: "advanced", duration: "2 hours" },
  { title: "Conversation Memory, Guardrails & Human Handover", week: "Week 7 — AI Agents & Chatbots", outcome: "Ship chatbots and agents that handle real customer conversations", difficulty: "advanced", duration: "1.5 hours" },

  // Week 8 — Real-World Business Systems
  { title: "Lead Generation Pipelines: Capture, Enrich & Route", week: "Week 8 — Real-World Business Systems", outcome: "Build the client systems most in demand on Upwork and in agencies", difficulty: "advanced", duration: "2 hours" },
  { title: "Data Scraping & Structured Extraction", week: "Week 8 — Real-World Business Systems", outcome: "Build the client systems most in demand on Upwork and in agencies", difficulty: "advanced", duration: "2 hours" },
  { title: "CRM Automation: HubSpot, GoHighLevel & Salesforce", week: "Week 8 — Real-World Business Systems", outcome: "Build the client systems most in demand on Upwork and in agencies", difficulty: "advanced", duration: "2 hours" },
  { title: "Email & Marketing Automation with AI Personalisation", week: "Week 8 — Real-World Business Systems", outcome: "Build the client systems most in demand on Upwork and in agencies", difficulty: "advanced", duration: "2 hours" },
  { title: "Calendar Automation & Internal Reporting Dashboards", week: "Week 8 — Real-World Business Systems", outcome: "Build the client systems most in demand on Upwork and in agencies", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Multi-Tool Orchestration Across n8n, Make & Zapier", week: "Week 8 — Real-World Business Systems", outcome: "Build the client systems most in demand on Upwork and in agencies", difficulty: "advanced", duration: "1.5 hours" },

  // Week 9 — Final Project, Security & Delivery
  { title: "Scope & Ship a Full AI Automation System", week: "Week 9 — Final Project, Security & Delivery", outcome: "A documented, portfolio-ready project you can demo to paying clients", difficulty: "advanced", duration: "8 hours" },
  { title: "Security: Credentials, Secrets & Client Data", week: "Week 9 — Final Project, Security & Delivery", outcome: "A documented, portfolio-ready project you can demo to paying clients", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Logging, Monitoring & Uptime Alerts", week: "Week 9 — Final Project, Security & Delivery", outcome: "A documented, portfolio-ready project you can demo to paying clients", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Testing, Staging vs Production & Versioning", week: "Week 9 — Final Project, Security & Delivery", outcome: "A documented, portfolio-ready project you can demo to paying clients", difficulty: "advanced", duration: "1.5 hours" },
  { title: "Documentation, Handover & Client-Style Demo", week: "Week 9 — Final Project, Security & Delivery", outcome: "A documented, portfolio-ready project you can demo to paying clients", difficulty: "advanced", duration: "2 hours" },

  // Weeks 10–11 — Freelancing & Client Acquisition
  { title: "Freelancing Fundamentals & Professional Setup", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "beginner", duration: "1.5 hours" },
  { title: "Upwork Profile Creation & Optimisation", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "beginner", duration: "2 hours" },
  { title: "LinkedIn Profile Building & Personal Branding", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "beginner", duration: "1.5 hours" },
  { title: "Portfolio & Case Study Building", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "intermediate", duration: "2 hours" },
  { title: "Finding & Applying for Freelance Projects", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Personalised Proposal Writing", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "intermediate", duration: "2 hours" },
  { title: "Client Communication & Professional Etiquette", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Pricing & First-Client Strategies", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "intermediate", duration: "1.5 hours" },
  { title: "Client Safety & Scam Awareness", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "beginner", duration: "1 hour" },
  { title: "Reviews, Testimonials & Long-Term Growth", week: "Weeks 10–11 — Freelancing & Client Acquisition", outcome: "Live Upwork & LinkedIn profiles, a portfolio, and a plan for your first client", difficulty: "intermediate", duration: "1 hour" },
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
