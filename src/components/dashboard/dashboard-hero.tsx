"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { RobotPeek } from "@/components/dashboard/robot-peek";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";

/**
 * The greeting banner at the top of the dashboard.
 *
 * The artwork is a cropped portrait of the robot anchored to the right rather
 * than a full-bleed background: stretched across a short, very wide banner,
 * `object-cover` kept a thin horizontal band and scaled it enormously, which
 * read as a cropped mess. The source is baked out with a soft alpha falloff so
 * it dissolves into the card on every side instead of ending in a rectangle.
 *
 * Two artworks are shipped and CSS picks one per theme — daylight for the light
 * palette, neon at night — so there is no flash and nothing to hydrate.
 */
export function DashboardHero({
  name,
  role,
  subtitle,
}: {
  name: string;
  role: string;
  subtitle?: string;
}) {
  const firstName = name.split(" ")[0];

  return (
    // Hover lives on this wrapper, which does NOT clip — the card inside still
    // hides its own overflow, but the assistant needs to rise above the edge.
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="peek"
      className="relative mt-14 sm:mt-16"
    >
      <RobotPeek />

      <div className="hero-card relative overflow-hidden rounded-2xl border border-[var(--line)] shadow-[var(--shadow-card)]">
      {/* Artwork, right-anchored and feathered on its left edge. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] max-w-[400px] sm:block">
        <Image
          src="/hero-robot-light.webp"
          alt=""
          fill
          priority
          sizes="380px"
          className="hero-art-light object-contain object-right-bottom"
        />
        <Image
          src="/hero-robot-dark.webp"
          alt=""
          fill
          priority
          sizes="380px"
          className="hero-art-dark object-contain object-right-bottom"
        />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-6 px-7 py-8 sm:px-9 sm:py-9">
        <div className="min-w-0 max-w-lg">
          <p className="hero-eyebrow text-[11px] font-bold uppercase tracking-[0.16em]">
            {role} portal
          </p>
          <h2 className="font-display mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.4rem]">
            <span className="hero-greeting">Welcome back,</span>{" "}
            <span className="hero-name">{firstName}</span>
          </h2>
          {subtitle && <p className="hero-sub mt-2 text-sm">{subtitle}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/roadmap">
              <Button size="lg">
                <Play className="h-4 w-4" /> Continue Learning
              </Button>
            </Link>
            <Link href="/assignments">
              <Button size="lg" variant="secondary">
                Assignments <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  );
}
