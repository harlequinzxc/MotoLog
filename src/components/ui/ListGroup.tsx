import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function ListGroup({ children, className, ...props }: { children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return <section {...props} className={cn("overflow-hidden rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900", className)}>{children}</section>;
}
