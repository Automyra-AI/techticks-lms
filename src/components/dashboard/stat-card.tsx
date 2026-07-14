"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardStats } from "@/types";

export function StatCard({ stat }: { stat: DashboardStats }) {
  const TrendIcon =
    stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : Minus;

  return (
    <Card className="group hover:border-violet-500/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{stat.value}</p>
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
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats }: { stats: DashboardStats[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
