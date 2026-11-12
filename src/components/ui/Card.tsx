import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
export function Card({children,className,...props}:{children:ReactNode}&HTMLAttributes<HTMLElement>){return <section {...props} className={cn("rounded-2xl border border-zinc-200 bg-white p-4 shadow-card dark:border-zinc-800 dark:bg-zinc-900 md:p-5",className)}>{children}</section>;}
