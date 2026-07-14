import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  showLabel = true,
  size = "md",
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-zinc-400">Progress</span>
          <span className="font-medium text-zinc-200">{Math.round(value)}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-zinc-800", heights[size])}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
