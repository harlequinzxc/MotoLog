import { Fuel, ReceiptText, Wrench } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup } from "@/components/ui/ListGroup";
import { formatLocalDateTime } from "@/lib/date";

export interface ActivityItem {
  id: string;
  occurredAt: string;
  onEdit: () => void;
  subtitle: string;
  title: string;
  type: "expense" | "fuel" | "service";
}

interface RecentActivityProps {
  items: ActivityItem[];
  onLogFuel: () => void;
}

export function RecentActivity({ items, onLogFuel }: RecentActivityProps) {
  const iconFor = { fuel: Fuel, service: Wrench, expense: ReceiptText } as const;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Latest activity</h2>
        <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-500">TAP TO EDIT</span>
      </div>
      <ListGroup>
        {items.length === 0 ? <EmptyState actionLabel="Log a Fill-Up" description="Fuel, service, and expense records will land here in time order." icon={Fuel} onAction={onLogFuel} title="Nothing logged yet" /> : items.slice(0, 3).map((item, index) => {
          const Icon = iconFor[item.type];
          return (
            <button className={`motion-press motion-list-item flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left ${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}`} data-motion="activity" key={item.id} onClick={item.onEdit} type="button">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-red-600 dark:bg-zinc-800 dark:text-red-400"><Icon aria-hidden="true" className="size-4" strokeWidth={2} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</span>
                <span className="mt-1 block truncate tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</span>
              </span>
              <span className="tabular-nums text-right text-[11px] text-zinc-500 dark:text-zinc-400">{formatLocalDateTime(item.occurredAt)}</span>
            </button>
          );
        })}
      </ListGroup>
    </section>
  );
}
