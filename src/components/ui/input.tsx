import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-quiet)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-quiet)]",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-sm font-medium text-zinc-300", className)} {...props}>
      {children}
    </label>
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-zinc-100 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-quiet)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
