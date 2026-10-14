"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flame, Check, Lock, Award, ArrowRight } from "lucide-react";
import type { Badge } from "@/lib/data";

type Streak = {
  current: number;
  studiedToday: boolean;
  totalDays: number;
  week: { label: string; date: string; active: boolean; isToday: boolean }[];
};

/** Days in a row with any activity, plus the last seven days at a glance. */
export function StreakCard({ streak }: { streak: Streak }) {
  const { current, studiedToday, week, totalDays } = streak;
  const best = week.filter((d) => d.active).length;

  return (
    <Card className="relative overflow-hidden tile-blue">
      {/* Soft glow so the tile is not a flat slab of colour. */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

      <CardContent className="relative p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium opacity-soft">Study streak</p>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
            {totalDays} {totalDays === 1 ? "day" : "days"} total
          </span>
        </div>

        <div className="mt-3 flex items-end gap-3">
          <Flame
            className={cn("h-11 w-11 shrink-0", current > 0 ? "opacity-100" : "opacity-35")}
            strokeWidth={1.75}
          />
          <p className="font-display flex items-baseline gap-1.5 text-5xl font-extrabold leading-none">
            {current}
            <span className="text-sm font-semibold opacity-soft">
              {current === 1 ? "day" : "days"}
            </span>
          </p>
        </div>

        <div className="mt-5 flex justify-between gap-1.5">
          {week.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              {/* The mascot carries the state: cheering on a day you studied,
                  tearful on one you missed. */}
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  d.active ? "bg-white/95 shadow-sm" : "bg-white/10",
                  d.isToday && !d.active && "ring-2 ring-white/70"
                )}
                title={`${d.date} — ${d.active ? "studied" : "missed"}`}
              >
                <Image
                  src={d.active ? "/streak-happy.webp" : "/streak-sad.webp"}
                  alt={d.active ? "Studied" : "Missed"}
                  width={34}
                  height={25}
                  className={cn("h-auto w-[26px]", d.active ? "opacity-100" : "opacity-70")}
                />
              </span>
              <span className={cn("text-[10px] font-medium", d.isToday ? "opacity-100" : "opacity-soft")}>
                {d.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-white/15 pt-3 text-xs opacity-soft">
          {studiedToday
            ? `Studied today — ${best} of the last 7 days active.`
            : current > 0
              ? "Finish a topic today to keep the streak alive."
              : "Complete a topic to start your streak."}
        </p>
      </CardContent>
    </Card>
  );
}

/** Achievements, earned ones first so there is always something to look at. */
export function BadgesCard({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned);
  const ordered = [...earned, ...badges.filter((b) => !b.earned)];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Achievements</CardTitle>
        <span className="text-sm font-semibold tabular-nums text-[var(--accent)]">
          {earned.length}/{badges.length}
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map((b) => (
            <div
              key={b.id}
              className={cn(
                "flex flex-col items-center rounded-xl border p-4 text-center transition-all",
                b.earned
                  ? "border-[var(--accent)]/30 bg-[var(--accent-quiet)] hover:-translate-y-0.5"
                  : "border-[var(--line)] bg-[var(--surface-sunk)] opacity-70"
              )}
              title={b.description}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full",
                  b.earned ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--line)] text-zinc-500"
                )}
              >
                {b.earned ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </span>
              <p className="font-display mt-2 text-sm font-bold text-zinc-100">{b.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{b.description}</p>
              {!b.earned && b.progress && (
                <p className="mt-1 text-[11px] font-semibold tabular-nums text-[var(--accent)]">{b.progress}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** The certificate requirements, surfaced before a student goes looking. */
export function CertificateCard({
  progress,
}: {
  progress: { requirements: { label: string; met: boolean; detail?: string }[]; allMet: boolean };
}) {
  const met = progress.requirements.filter((r) => r.met).length;
  const total = progress.requirements.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Certificate</CardTitle>
        <span className="text-sm font-semibold tabular-nums text-[var(--accent)]">
          {met}/{total}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              progress.allMet ? "bg-emerald-500" : "bg-[var(--accent)]"
            )}
            style={{ width: `${(met / total) * 100}%` }}
          />
        </div>

        <ul className="space-y-2">
          {progress.requirements.map((r) => (
            <li key={r.label} className="flex items-start gap-2.5 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  r.met ? "bg-emerald-500 text-white" : "border border-[var(--line-strong)]"
                )}
              >
                {r.met && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0">
                <span className={r.met ? "text-zinc-300" : "text-zinc-400"}>{r.label}</span>
                {r.detail && <span className="block text-xs text-zinc-500">{r.detail}</span>}
              </span>
            </li>
          ))}
        </ul>

        {progress.allMet && (
          <Link href="/certificates">
            <Button className="w-full">
              Claim your certificate <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
