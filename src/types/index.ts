export type UserRole = "admin" | "trainer" | "student";

export type NodeStatus = "locked" | "completed" | "in_progress" | "not_started";

export type AssignmentStatus = "pending" | "approved" | "revision_needed" | "rejected" | "late";

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface DashboardStats {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export interface RoadmapNodeData {
  id: string;
  title: string;
  description?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration?: string;
  status: NodeStatus;
  prerequisites?: string;
  completionPercent?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "mcq" | "multi" | "coding";
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}
