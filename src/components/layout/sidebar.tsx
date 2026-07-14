"use client";

import Link from "next/link";
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
  MessageSquare,
  GraduationCap,
  BarChart3,
  Users,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { useState } from "react";

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
  MessageSquare,
  GraduationCap,
  BarChart3,
  Users,
  Settings,
};

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-400">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-100">TechTicks</p>
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
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-600/15 text-violet-400"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
              title={collapsed ? item.title : undefined}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}

export function Header({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-xs capitalize text-zinc-500">{user.role} Portal</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-zinc-200">{user.name}</p>
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
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-red-400"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
