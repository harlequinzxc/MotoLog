import { Fuel } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { MonthlySpend } from "@/utils/reportMetrics";

interface MonthlySpendingChartProps {
  currencyCode: string;
  months: MonthlySpend[];
  onLogFuel: () => void;
}

const STACKS = [
  { className: "bg-red-500", key: "fuel", label: "Fuel" },
  { className: "bg-amber-500", key: "service", label: "Service" },
  { className: "bg-sky-500", key: "expenses", label: "Expenses" }
] as const;

export function MonthlySpendingChart({ currencyCode, months, onLogFuel }: MonthlySpendingChartProps) {
  if (months.length === 0) {
    return <EmptyState actionLabel="Log a Fill-Up" description="Log a home-currency cost to build monthly spending bars." icon={Fuel} onAction={onLogFuel} title="No monthly costs yet" />;
  }

  const maximum = Math.max(...months.map((month) => month.total), 1);

  return (
    <div className="motion-chart-enter grid gap-4" data-motion="monthly-chart" key={months.map((month) => `${month.key}-${month.total}`).join("-")}>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
        {STACKS.map((stack) => <span className="inline-flex items-center gap-1.5" key={stack.key}><span aria-hidden="true" className={`size-2.5 rounded-full ${stack.className}`} />{stack.label}</span>)}
      </div>
      <div className="overflow-hidden">
        <div className="grid h-56 items-end gap-1 border-b border-zinc-200 px-1 dark:border-zinc-800" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
          {months.map((month) => {
            const height = Math.max(month.total / maximum * 100, 4);
            const shortLabel = month.label.split(" ")[0];
            return (
              <div className="motion-list-item flex min-w-0 flex-col justify-end" data-motion="monthly-bar" key={month.key}>
                <div className="flex flex-1 flex-col justify-end">
                  <div aria-label={`${month.label}: ${formatCurrency(month.total, currencyCode)}`} className="flex w-full flex-col-reverse overflow-hidden rounded-t-md shadow-sm" style={{ height: `${height}%` }} title={`${month.label}: ${formatCurrency(month.total, currencyCode)}`}>
                    {STACKS.map((stack) => {
                      const amount = month[stack.key];
                      if (amount <= 0) return null;
                      return <span className={stack.className} key={stack.key} style={{ height: `${amount / month.total * 100}%` }} />;
                    })}
                  </div>
                </div>
                <p className="mt-2 min-w-0 text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400"><span className="block truncate tabular-nums" title={month.label}>{shortLabel}</span></p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
