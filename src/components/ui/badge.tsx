import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    info: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
    locked: { label: "Locked", variant: "default" },
    completed: { label: "Completed", variant: "success" },
    in_progress: { label: "In Progress", variant: "warning" },
    not_started: { label: "Not Started", variant: "default" },
    pending: { label: "Pending", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    revision_needed: { label: "Revision Needed", variant: "warning" },
    rejected: { label: "Rejected", variant: "danger" },
    late: { label: "Late", variant: "danger" },
    present: { label: "Present", variant: "success" },
    late_attendance: { label: "Late", variant: "warning" },
    absent: { label: "Absent", variant: "danger" },
    excused: { label: "Excused", variant: "info" },
  };

  const item = config[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
