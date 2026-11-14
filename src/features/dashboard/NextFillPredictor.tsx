import { CalendarClock, Fuel, Gauge } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatLocalDateTime } from "@/lib/date";
import { formatDistance, formatVolume } from "@/lib/units";
import type { DistanceUnit, VolumeUnit } from "@/types";

interface PredictorProps {
  distanceUnit: DistanceUnit;
  onLogFuel: () => void;
  value: {
    currentTankPercent: number;
    expectedRefuelAt: string | null;
    remainingRangeKm: number;
    remainingVolumeLitres: number;
  } | null;
  volumeUnit: VolumeUnit;
}

export function NextFillPredictor({ distanceUnit, onLogFuel, value, volumeUnit }: PredictorProps) {
  if (!value) {
    return (
      <section className="border-t border-zinc-200 py-6 dark:border-zinc-800">
        <EmptyState actionLabel="Log a Fill-Up" description="Complete two full-tank intervals to unlock a reliable tank forecast." icon={Fuel} onAction={onLogFuel} title="Forecast is warming up" />
      </section>
    );
  }

  const tankPercent = Math.max(0, Math.min(100, value.currentTankPercent));

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-zinc-50 dark:border-zinc-800" aria-label="Fuel reserve">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-400">FUEL RESERVE</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">Plan the next stop</p>
        </div>
        <Button onClick={onLogFuel} size="sm">Log fill</Button>
      </div>
      <div className="motion-chart-enter mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-3" data-motion="predictor" key={`${tankPercent}-${value.remainingRangeKm}`}>
        <div>
          <Gauge aria-hidden="true" className="size-5 text-red-400" strokeWidth={2} />
          <p className="mt-2 tabular-nums font-semibold">{formatDistance(value.remainingRangeKm, distanceUnit)}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">RANGE</p>
        </div>
        <div>
          <Fuel aria-hidden="true" className="size-5 text-red-400" strokeWidth={2} />
          <p className="mt-2 tabular-nums font-semibold">{tankPercent.toFixed(0)}%</p>
          <p className="mt-1 tabular-nums text-[10px] font-semibold tracking-[0.14em] text-zinc-400">{formatVolume(value.remainingVolumeLitres, volumeUnit)} LEFT</p>
        </div>
        <div>
          <CalendarClock aria-hidden="true" className="size-5 text-red-400" strokeWidth={2} />
          <p className="mt-2 tabular-nums text-sm font-semibold">{value.expectedRefuelAt ? formatLocalDateTime(value.expectedRefuelAt) : "—"}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">PROJECTED</p>
        </div>
      </div>
      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <span className="motion-progress absolute inset-0 rounded-full bg-red-500" data-motion="progress" style={{ clipPath: `inset(0 ${100 - tankPercent}% 0 0)` }} />
      </div>
    </section>
  );
}
