import { BarChart3 } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { MonthlySpend } from "@/utils/reportMetrics";

interface MonthlySpendingChartProps {
  currencyCode: string;
  months: MonthlySpend[];
}

const STACKS = [
  { className: "bg-red-500", key: "fuel", label: "Fuel" },
  { className: "bg-amber-500", key: "service", label: "Service" },
  { className: "bg-sky-500", key: "expenses", label: "Expenses" }
] as const;

export function MonthlySpendingChart({ currencyCode, months }: MonthlySpendingChartProps) {
  if (months.length === 0) {
    return (
      <div className="grid min-h-52 place-items-center py-6 text-center">
        <div>
          <BarChart3 aria-hidden="true" className="mx-auto size-8 text-red-500" strokeWidth={2} />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Log a home-currency cost to build monthly spending bars.</p>
        </div>
      </div>
    );
  }

  const maximum = Math.max(...months.map((month) => month.total), 1);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
        {STACKS.map((stack) => (
          <span className="inline-flex items-center gap-1.5" key={stack.key}>
            <span aria-hidden="true" className={`size-2.5 rounded-full ${stack.className}`} />
            {stack.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex h-56 min-w-max items-end gap-3 border-b border-zinc-200 px-1 dark:border-zinc-800">
          {months.map((month) => {
            const height = Math.max(month.total / maximum * 100, 4);
            return (
              <div className="flex h-full w-14 flex-col justify-end" key={month.key}>
                <div className="flex flex-1 flex-col justify-end">
                  <div
                    aria-label={`${month.label}: ${formatCurrency(month.total, currencyCode)}`}
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t-xl shadow-sm"
                    style={{ height: `${height}%` }}
                    title={`${month.label}: ${formatCurrency(month.total, currencyCode)}`}
                  >
                    {STACKS.map((stack) => {
                      const amount = month[stack.key];
                      if (amount <= 0) return null;
                      return <span className={stack.className} key={stack.key} style={{ height: `${amount / month.total * 100}%` }} />;
                    })}
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <span className="block tabular-nums">{month.label}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
