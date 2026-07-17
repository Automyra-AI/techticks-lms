import Link from "next/link";
import { Zap, ArrowRight, Map, ClipboardList, BarChart3, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-violet-950/20">
      <nav className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/60 px-6 py-4 backdrop-blur-sm lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-zinc-100">TechTicks Academy</p>
            <p className="text-xs text-zinc-500">AI Automation LMS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-24 lg:px-12 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-zinc-950 to-zinc-950" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <Bot className="h-4 w-4" />
            Built for AI Automation Academy
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
            Learn Automation Like a{" "}
            <span className="gradient-text">Developer</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Notion + roadmap.sh + Trello + GitHub + Udemy — combined into one premium LMS
            built specifically for TechTicks AI Automation Academy.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg">
                Start Learning <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Trainer Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-t border-zinc-800/80 px-6 py-20 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-950/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="bg-gradient-to-r from-zinc-100 via-violet-200 to-zinc-100 bg-clip-text text-center text-3xl font-bold text-transparent">
            Everything You Need to Master AI Automation
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Map, title: "Interactive Roadmap", desc: "roadmap.sh-style learning paths with zoom, pan, and filters" },
              { icon: ClipboardList, title: "Assignment System", desc: "Google Drive submissions, rubrics, feedback, and grading" },
              { icon: BarChart3, title: "Progress Analytics", desc: "Track attendance, grades, and weekly progress" },
              { icon: Bot, title: "AI Features", desc: "AI reviewer, quiz generator, code review, and chatbot" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-900/30 p-6 transition-all hover:border-violet-500/40 hover:from-violet-950/40 hover:shadow-lg hover:shadow-violet-950/40"
              >
                <div className="inline-flex rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 p-2 ring-1 ring-violet-500/20">
                  <feature.icon className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="mt-4 font-semibold text-zinc-100">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800/80 bg-gradient-to-b from-transparent to-violet-950/20 px-6 py-8 text-center text-sm text-zinc-500">
        © 2026 TechTicks AI Automation Academy. All rights reserved.
      </footer>
    </div>
  );
}
