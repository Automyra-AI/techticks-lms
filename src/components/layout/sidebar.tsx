"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Map,
  FolderOpen,
  UserCheck,
  Award,
  Megaphone,
  Calendar,
  GraduationCap,
  BarChart3,
  Users,
  Layers,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { useState } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/** Shared spring so the pill, the tap dip and the icon pop feel like one motion. */
const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Map,
  FolderOpen,
  UserCheck,
  Award,
  Megaphone,
  Calendar,
  GraduationCap,
  BarChart3,
  Users,
  Layers,
  Settings,
  HelpCircle,
};

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <Image
          src="/techticks-logo.png"
          alt="TechTicks"
          width={36}
          height={36}
          priority
          className="h-9 w-9 shrink-0 object-contain"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display truncate text-[15px] font-extrabold text-zinc-100">TechTicks</p>
            <p className="truncate text-xs text-zinc-500">AI Automation Academy</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className="relative block"
            >
              <motion.span
                // Pressing any item dips slightly, so a tap feels physical.
                whileTap={{ scale: 0.96 }}
                transition={SPRING}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "text-[var(--accent-ink)]" : "text-zinc-400 hover:bg-[var(--surface-sunk)] hover:text-zinc-100"
                )}
              >
                {/* One shared pill across all items, so it glides from the old
                    item to the new one rather than blinking out and back in.
                    It sits at z-0 (NOT a negative z-index, which would drop it
                    behind the sidebar's own background and leave the white
                    label invisible on the light theme) with the content above. */}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={SPRING}
                    className="absolute inset-0 z-0 rounded-lg bg-[var(--accent)] shadow-[var(--shadow-card)]"
                  />
                )}

                {Icon && (
                  <motion.span
                    key={isActive ? "on" : "off"}
                    initial={isActive ? { scale: 0.6, rotate: -12 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 14 }}
                    className="relative z-10 flex shrink-0"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </motion.span>
                )}
                {!collapsed && <span className="relative z-10">{item.title}</span>}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)] p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-[var(--surface-sunk)] hover:text-zinc-300"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}

export function Header({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const section = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-6">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold leading-tight text-zinc-100">
          {section?.title ?? "TechTicks Academy"}
        </h1>
        <p className="truncate text-xs font-medium capitalize text-zinc-500">{user.role}</p>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-ink)] shadow-[var(--shadow-card)]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="font-display text-[15px] font-bold text-zinc-100">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>

        <form action="/api/auth/logout" method="POST" onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}>
          <button
            type="submit"
            className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
