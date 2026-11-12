import { Fuel, ReceiptText, Wrench } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatLocalDateTime } from "@/lib/date";

export interface ActivityItem { id: string; occurredAt: string; title: string; subtitle: string; type: "expense" | "fuel" | "service"; onEdit: () => void }

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const iconFor = { fuel: Fuel, service: Wrench, expense: ReceiptText } as const;
  return <Card><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">RECENT ACTIVITY</p><div className="mt-3 grid divide-y divide-zinc-200 dark:divide-zinc-800">{items.length === 0 ? <p className="py-3 text-sm text-zinc-600 dark:text-zinc-400">No recent activity.</p> : items.slice(0,3).map(item=>{const Icon=iconFor[item.type];return <button className="flex min-h-[56px] items-center gap-3 py-3 text-left" key={item.id} onClick={item.onEdit} type="button"><Icon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</span><span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</span></span><span className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">{formatLocalDateTime(item.occurredAt)}</span></button>})}</div></Card>;
}
