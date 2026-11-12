import { CalendarClock, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { daysUntil, formatLocalDate } from "@/lib/date";
import type { FixedCost } from "@/types";

interface FixedCostListProps {
  costs: FixedCost[];
}

function statusForCost(cost: FixedCost) {
  const days = daysUntil(cost.renewalAt);
  if (days < 0) return { label: "Expired", tone: "danger" as const };
  if (days <= 30) return { label: `Due in ${days}d`, tone: "warning" as const };
  return { label: `Due in ${days}d`, tone: "neutral" as const };
}

export function FixedCostList({ costs }: FixedCostListProps) {
  if (costs.length === 0) {
    return (
      <Card className="flex items-center gap-3">
        <ReceiptText aria-hidden="true" className="size-5 text-zinc-500" strokeWidth={2} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No fixed ownership costs recorded yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {costs.map((cost) => {
        const status = statusForCost(cost);
        return (
          <Card className="flex items-center gap-3" key={cost.id}>
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <CalendarClock aria-hidden="true" className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{cost.label}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{cost.billingCycle} · Renews {formatLocalDate(cost.renewalAt)}</p>
            </div>
            <div className="text-right">
              <p className="tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">S${cost.amount.toFixed(2)}</p>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
