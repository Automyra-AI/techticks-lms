# TechTicks Academy — AI Automation LMS

A modern Learning Management System built for **TechTicks AI Automation Academy**. Combines the best of Notion, roadmap.sh, Trello, GitHub, and Udemy into one premium platform.

## Features

- **3 Role-Based Portals** — Admin, Trainer, and Student dashboards
- **Interactive Roadmap** — roadmap.sh-style course progression with zoom, pan, and filters
- **Assignment System** — GitHub submissions, rubrics, grading, and feedback
- **Progress Tracking** — Lesson, weekly, and course-level progress bars
- **Attendance Management** — Present, late, absent, excused tracking
- **Resources Library** — Videos, PDFs, prompts, templates, cheat sheets
- **Live Sessions** — Calendar with Zoom/Google Meet integration ready
- **Certificates** — Auto-issued based on requirements
- **Analytics** — Charts for student growth, completion, and attendance
- **AI Features** — Placeholders for AI reviewer, quiz generator, code review (coming soon)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Database | Turso (libSQL) — free tier |
| ORM | Drizzle ORM |
| Roadmap | React Flow |
| Charts | Recharts |
| Auth | JWT + HTTP-only cookies |
| Deploy | Vercel |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

For local development, no Turso credentials are needed — the app uses `file:local.db` automatically.

### 3. Push database schema & seed demo data

```bash
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techticks.com | password123 |
| Trainer | trainer@techticks.com | password123 |
| Student | student@techticks.com | password123 |

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial TechTicks Academy LMS"
git push origin main
```

### 2. Create Turso Database (Free)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create techticks-academy

# Get credentials
turso db show techticks-academy --url
turso db tokens create techticks-academy
```

### 3. Deploy on Vercel

1. Import your GitHub repo at [vercel.com](https://vercel.com)
2. Add environment variables:
   - `TURSO_DATABASE_URL` — from Turso CLI
   - `TURSO_AUTH_TOKEN` — from Turso CLI
   - `JWT_SECRET` — generate with `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` — your Vercel domain
3. Deploy

### 4. Seed production database

After first deploy, run seed locally pointing to Turso:

```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:push
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:seed
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected portal pages
│   ├── api/             # API routes
│   ├── login/           # Auth page
│   └── page.tsx         # Landing page
├── components/
│   ├── dashboard/       # Stats, charts
│   ├── layout/          # Sidebar, header
│   ├── roadmap/         # React Flow roadmap
│   ├── shared/          # Reusable panels
│   └── ui/              # Base UI components
├── lib/
│   ├── db/              # Schema, seed, client
│   ├── auth.ts          # JWT auth
│   ├── data.ts          # Server data fetching
│   └── constants.ts     # Nav items, colors
└── types/               # TypeScript types
```

## Course Roadmap

The default seed includes the full AI Automation course roadmap:

Introduction → Python → APIs → n8n → OpenAI → AI Agents → RAG → Final Project → Certificate

Send your custom course outline and it can be loaded into the roadmap nodes.

## License

Private — TechTicks AI Automation Academy
