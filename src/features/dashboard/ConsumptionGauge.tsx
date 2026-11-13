import { TrendingDown, TrendingUp } from "lucide-react";

import { formatEfficiency } from "@/lib/units";
import type { ConsumptionUnit } from "@/types";

interface ConsumptionGaugeProps {
  average: number | null;
  best: number | null;
  trendPercent: number | null;
  unit: ConsumptionUnit;
  worst: number | null;
}

export function ConsumptionGauge({ average, best, trendPercent, unit, worst }: ConsumptionGaugeProps) {
  const progress = average === null ? 0 : Math.min(Math.max(average / 30 * 100, 8), 96);

  return (
    <div className="grid gap-6">
      <div className="motion-chart-enter relative mx-auto grid size-48 place-items-center rounded-full" data-motion="gauge" key={`${average}-${unit}`} style={{ background: `conic-gradient(#ef4444 ${progress}%, rgb(39 39 42) ${progress}% 100%)` }}>
        <div className="grid size-[calc(100%-14px)] place-items-center rounded-full bg-zinc-950 px-4 text-center dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500">AVG. CONSUMPTION</p>
            <p className="mt-2 tabular-nums text-2xl font-semibold tracking-tight text-zinc-50">{formatEfficiency(average, unit)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200 pt-4 text-center dark:divide-zinc-800 dark:border-zinc-800">
        <div className="px-2">
          <p className="tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatEfficiency(best, unit)}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">BEST</p>
        </div>
        <div className="px-2">
          {trendPercent === null ? <p className="tabular-nums text-sm text-zinc-500">—</p> : <p className={`inline-flex items-center gap-1 tabular-nums text-sm font-semibold ${trendPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{trendPercent >= 0 ? <TrendingUp className="size-4" strokeWidth={2} /> : <TrendingDown className="size-4" strokeWidth={2} />}{Math.abs(trendPercent).toFixed(1)}%</p>}
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">TREND</p>
        </div>
        <div className="px-2">
          <p className="tabular-nums text-sm font-semibold text-amber-600 dark:text-amber-400">{formatEfficiency(worst, unit)}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">LOWEST</p>
        </div>
      </div>
    </div>
  );
}
