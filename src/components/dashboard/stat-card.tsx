"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ClipboardList,
  BookOpenCheck,
  CalendarCheck,
  Award,
  Users,
  GraduationCap,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStats } from "@/types";

/** A glyph per metric, matched on the label the data layer already produces. */
const ICONS: Record<string, LucideIcon> = {
  "Course Progress": Target,
  "Assignments Due": ClipboardList,
  "Completed Lessons": BookOpenCheck,
  Attendance: CalendarCheck,
  "Latest Grade": Award,
  "Total Students": Users,
  "Active Courses": GraduationCap,
  Resources: FolderOpen,
};

/** Pastel treatment for the leading figures, as on the reference dashboard. */
const TILES = ["tile-mint", "tile-amber", "tile-blue"];

export function StatCard({ stat, tile }: { stat: DashboardStats; tile?: string }) {
  const TrendIcon =
    stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : Minus;
  const Glyph = ICONS[stat.label];

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]",
        tile
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("text-sm text-zinc-400", tile && "opacity-soft")}>{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">{stat.value}</p>
            {stat.change && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendIcon
                  className={cn(
                    "h-3 w-3",
                    stat.trend === "up" && "text-emerald-400",
                    stat.trend === "down" && "text-red-400",
                    stat.trend === "neutral" && "text-zinc-500"
                  )}
                />
                <span
                  className={cn(
                    stat.trend === "up" && "text-emerald-400",
                    stat.trend === "down" && "text-red-400",
                    stat.trend === "neutral" && "text-zinc-500"
                  )}
                >
                  {stat.change}
                </span>
              </div>
            )}
          </div>

          {Glyph && (
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                tile ? "bg-white/20" : "bg-[var(--accent-quiet)] text-[var(--accent)]"
              )}
            >
              <Glyph className="h-[18px] w-[18px]" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats }: { stats: DashboardStats[] }) {
  // Students have five metrics; a four-column grid left the fifth stranded on
  // its own row with a wide gap beside it.
  const wide = stats.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4";

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", wide)}>
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} tile={TILES[i]} />
      ))}
    </div>
  );
}
