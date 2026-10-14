"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Switches between the day and night palettes and remembers the choice.
 *
 * Both icons are rendered and CSS shows the right one for the current
 * `data-theme`, so there is no React state to hydrate — the button can never
 * flash the wrong icon, and the server and client markup always match.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage — the theme still applies for this visit.
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.86, rotate: -12 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      title="Toggle night mode"
      aria-label="Toggle night mode"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[var(--accent-quiet)] hover:text-[var(--accent)]",
        className
      )}
    >
      <Sun className="theme-icon-sun h-5 w-5" />
      <Moon className="theme-icon-moon h-5 w-5" />
    </motion.button>
  );
}
