import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function RecordSummaryView({ description, icon: Icon, title }: { description: string; icon: LucideIcon; title: string }) {
  return <Card className="mx-auto max-w-md text-center"><Icon aria-hidden="true" className="mx-auto size-8 text-red-500" strokeWidth={2} /><h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p></Card>;
}
