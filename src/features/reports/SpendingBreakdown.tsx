import { Fuel } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { SpendingCategory } from "@/utils/reportMetrics";

interface SpendingBreakdownProps {
  categories: SpendingCategory[];
  currencyCode: string;
  onLogFuel: () => void;
  totalSpending: number;
}

const CATEGORY_COLORS = ["#ef4444", "#f59e0b", "#38bdf8", "#a78bfa", "#34d399", "#fb7185", "#facc15", "#2dd4bf", "#818cf8", "#fb923c", "#e879f9", "#84cc16", "#94a3b8", "#f97316"];
const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function colorFor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export function SpendingBreakdown({ categories, currencyCode, onLogFuel, totalSpending }: SpendingBreakdownProps) {
  if (categories.length === 0) {
    return <EmptyState actionLabel="Log a Fill-Up" description="A home-currency fuel, service, or expense cost will appear in this breakdown." icon={Fuel} onAction={onLogFuel} title="No spending in this timeframe" />;
  }

  let offset = 0;

  return (
    <div className="motion-chart-enter grid gap-5" data-motion="spending-breakdown" key={categories.map((category) => `${category.key}-${category.amount}`).join("-")}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="relative grid size-48 place-items-center">
          <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" fill="none" r={RADIUS} stroke="currentColor" strokeWidth="16" className="text-zinc-100 dark:text-zinc-800" />
            {categories.map((category, index) => {
              const segmentLength = CIRCUMFERENCE * category.share / 100;
              const gap = categories.length > 1 ? Math.min(2, segmentLength / 2) : 0;
              const dashLength = Math.max(segmentLength - gap, 0);
              const dashOffset = -offset;
              offset += segmentLength;
              return <circle cx="64" cy="64" fill="none" key={category.key} r={RADIUS} stroke={colorFor(index)} strokeDasharray={`${dashLength} ${CIRCUMFERENCE - dashLength}`} strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="16" />;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">TOTAL</p>
              <p className="mt-1 max-w-28 tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(totalSpending, currencyCode)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup><col className="w-[46%]" /><col className="w-[34%]" /><col className="w-[20%]" /></colgroup>
          <thead className="border-b border-zinc-200 text-xs font-semibold tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-0 py-2 font-semibold" scope="col">Category</th>
              <th className="px-2 py-2 text-right font-semibold" scope="col">Spend</th>
              <th className="px-0 py-2 text-right font-semibold" scope="col">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {categories.map((category, index) => (
              <tr className="motion-list-item" data-motion="spending-row" key={category.key}>
                <th className="py-3 pr-2 font-medium text-zinc-700 dark:text-zinc-200" scope="row">
                  <span className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorFor(index) }} /><span className="break-words">{category.label}</span></span>
                </th>
                <td className="break-words px-2 py-3 text-right tabular-nums text-xs text-zinc-900 dark:text-zinc-50">{formatCurrency(category.amount, currencyCode)}</td>
                <td className="break-words py-3 text-right tabular-nums text-xs text-zinc-600 dark:text-zinc-300">{category.share.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
