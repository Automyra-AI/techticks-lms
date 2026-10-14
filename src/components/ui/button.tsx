import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] shadow-[var(--shadow-card)]",
        secondary: "bg-[var(--surface)] text-zinc-200 hover:bg-[var(--surface-sunk)] border border-[var(--line-strong)]",
        ghost: "text-zinc-400 hover:bg-[var(--accent-quiet)] hover:text-zinc-100",
        outline: "border border-[var(--line-strong)] bg-transparent text-zinc-200 hover:border-[var(--accent)] hover:text-zinc-100",
        destructive: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
