import { type NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["admin", "trainer", "student"] },
  { title: "Courses", href: "/courses", icon: "BookOpen", roles: ["admin", "trainer", "student"] },
  { title: "Assignments", href: "/assignments", icon: "ClipboardList", roles: ["admin", "trainer", "student"] },
  { title: "Roadmap", href: "/roadmap", icon: "Map", roles: ["admin", "trainer", "student"] },
  { title: "Resources", href: "/resources", icon: "FolderOpen", roles: ["admin", "trainer", "student"] },
  { title: "Attendance", href: "/attendance", icon: "UserCheck", roles: ["admin", "trainer", "student"] },
  { title: "Grades", href: "/grades", icon: "Award", roles: ["admin", "trainer", "student"] },
  { title: "Quizzes", href: "/quizzes", icon: "HelpCircle", roles: ["admin", "trainer", "student"] },
  { title: "Announcements", href: "/announcements", icon: "Megaphone", roles: ["admin", "trainer", "student"] },
  { title: "Calendar", href: "/calendar", icon: "Calendar", roles: ["admin", "trainer", "student"] },
  { title: "Messages", href: "/messages", icon: "MessageSquare", roles: ["admin", "trainer", "student"] },
  { title: "Certificates", href: "/certificates", icon: "GraduationCap", roles: ["admin", "trainer", "student"] },
  { title: "Analytics", href: "/analytics", icon: "BarChart3", roles: ["admin", "trainer"] },
  { title: "Users", href: "/users", icon: "Users", roles: ["admin"] },
  { title: "Settings", href: "/settings", icon: "Settings", roles: ["admin", "trainer", "student"] },
];

export const STATUS_COLORS: Record<string, string> = {
  locked: "bg-zinc-700 text-zinc-400 border-zinc-600",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  not_started: "bg-zinc-800 text-zinc-500 border-zinc-700",
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  revision_needed: "bg-orange-500/20 text-orange-400",
  rejected: "bg-red-500/20 text-red-400",
  late: "bg-red-500/20 text-red-400",
  present: "bg-emerald-500/20 text-emerald-400",
  absent: "bg-red-500/20 text-red-400",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-500/10",
  intermediate: "text-amber-400 bg-amber-500/10",
  advanced: "text-red-400 bg-red-500/10",
  easy: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  hard: "text-red-400 bg-red-500/10",
};
