import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  size?: Size;
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "bg-red-600 text-white shadow-crimson hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400",
  secondary: "border border-zinc-200 bg-white text-zinc-900 shadow-card hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800",
  ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
  danger: "bg-rose-600 text-white hover:bg-rose-500"
};

const sizes: Record<Size, string> = {
  sm: "min-h-[44px] px-3 text-sm",
  md: "min-h-[44px] px-4 text-sm",
  lg: "min-h-[52px] px-5 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ children, className, disabled, loading = false, size = "md", type = "button", variant = "primary", ...props }, ref) {
  return (
    <button
      {...props}
      aria-busy={loading}
      className={cn("motion-press inline-flex items-center justify-center gap-2 rounded-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50", sizes[size], variants[variant], className)}
      data-motion="button"
      disabled={disabled || loading}
      ref={ref}
      type={type}
    >
      {loading ? <span aria-label="Loading" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" data-motion="spinner" /> : null}
      {children}
    </button>
  );
});
