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
    <div className="grid gap-4">
      <div className="motion-chart-enter relative mx-auto grid size-52 place-items-center rounded-full" data-motion="gauge" key={`${average}-${unit}`} style={{ background: `conic-gradient(#ef4444 ${progress}%, rgb(63 63 70) ${progress}% 100%)` }}>
        <div className="grid size-[calc(100%-18px)] place-items-center rounded-full bg-white text-center dark:bg-zinc-900">
          <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">AVERAGE</p>
          <p className="mt-1 tabular-nums text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{formatEfficiency(average, unit)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatEfficiency(best, unit)}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">BEST</p>
        </div>
        <div>
          {trendPercent === null ? <p className="tabular-nums text-sm text-zinc-500">—</p> : <p className={`inline-flex items-center gap-1 tabular-nums text-sm font-semibold ${trendPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{trendPercent >= 0 ? <TrendingUp className="size-4" strokeWidth={2} /> : <TrendingDown className="size-4" strokeWidth={2} />}{Math.abs(trendPercent).toFixed(1)}%</p>}
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">TREND</p>
        </div>
        <div>
          <p className="tabular-nums text-sm font-semibold text-amber-600 dark:text-amber-400">{formatEfficiency(worst, unit)}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">WORST</p>
        </div>
      </div>
    </div>
  );
}
