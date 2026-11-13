import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  action?: ReactNode;
  className?: string;
  eyebrow?: string;
  title: string;
}

export function SectionHeader({ action, className, eyebrow, title }: SectionHeaderProps) {
  return (
    <header className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{eyebrow}</p> : null}
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h1>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
