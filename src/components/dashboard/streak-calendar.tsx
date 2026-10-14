"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local YYYY-MM-DD, matching how activity days are stored. */
function key(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * A month view of the days a student actually studied, so a streak is something
 * they can see rather than a number they have to trust.
 *
 * Active days come pre-computed from the server; this only lays them out and
 * lets the student page back through earlier months.
 */
export function StreakCalendar({
  activeDays,
  todayKey,
}: {
  activeDays: string[];
  todayKey: string;
}) {
  const active = new Set(activeDays);
  const [year, setYear] = useState(() => Number(todayKey.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(todayKey.slice(5, 7)) - 1);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-first; the grid starts on Monday.
  const leading = (first.getDay() + 6) % 7;

  const monthLabel = first.toLocaleString("en-US", { month: "long", year: "numeric" });
  const studiedThisMonth = Array.from({ length: daysInMonth }, (_, i) =>
    active.has(key(year, month, i + 1)) ? 1 : 0
  ).reduce((a: number, b: number) => a + b, 0);

  function shift(by: number) {
    const d = new Date(year, month + by, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[var(--accent)]" /> Your month
        </CardTitle>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-[var(--surface-sunk)] hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-[var(--surface-sunk)] hover:text-zinc-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-sm font-bold text-zinc-100">{monthLabel}</p>
          <p className="text-xs text-zinc-500">
            <span className="font-semibold text-[var(--accent)]">{studiedThisMonth}</span>{" "}
            {studiedThisMonth === 1 ? "day" : "days"} studied
          </p>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-semibold text-zinc-500">
              {d}
            </div>
          ))}

          {Array.from({ length: leading }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const k = key(year, month, day);
            const studied = active.has(k);
            const isToday = k === todayKey;
            const future = k > todayKey;

            return (
              <div
                key={k}
                title={`${k}${studied ? " — studied" : future ? "" : " — missed"}`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] font-semibold transition-colors",
                  studied
                    ? "bg-[var(--accent-quiet)] text-[var(--accent)]"
                    : future
                      ? "text-zinc-600"
                      : "bg-[var(--surface-sunk)] text-zinc-500",
                  isToday && "ring-2 ring-[var(--accent)]"
                )}
              >
                {studied ? (
                  <Image src="/streak-happy.webp" alt="" width={26} height={19} className="h-auto w-[22px]" />
                ) : (
                  day
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--line)] pt-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[var(--accent-quiet)]" /> Studied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[var(--surface-sunk)]" /> Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-[var(--accent)]" /> Today
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
