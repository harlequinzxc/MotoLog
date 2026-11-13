import { CalendarClock, Fuel, Gauge } from "lucide-react";

import { Card } from "@/components/ui/Card";
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
    return <Card><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">NEXT FILL-UP</p><EmptyState actionLabel="Log a Fill-Up" description="Complete two full-tank intervals to enable a reliable prediction." icon={Fuel} onAction={onLogFuel} title="Prediction needs more history" /></Card>;
  }

  const tankPercent = Math.max(0, Math.min(100, value.currentTankPercent));

  return (
    <Card>
      <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">NEXT FILL-UP</p>
      <div className="motion-chart-enter mt-4 grid grid-cols-3 gap-3" data-motion="predictor" key={`${tankPercent}-${value.remainingRangeKm}`}>
        <div>
          <Gauge aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />
          <p className="mt-2 tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatDistance(value.remainingRangeKm, distanceUnit)}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">RANGE LEFT</p>
        </div>
        <div>
          <Fuel aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />
          <p className="mt-2 tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{tankPercent.toFixed(0)}%</p>
          <p className="mt-1 tabular-nums text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">{formatVolume(value.remainingVolumeLitres, volumeUnit)} LEFT</p>
        </div>
        <div>
          <CalendarClock aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />
          <p className="mt-2 tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value.expectedRefuelAt ? formatLocalDateTime(value.expectedRefuelAt) : "—"}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">NEXT REFUEL</p>
        </div>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <span className="motion-progress absolute inset-0 rounded-full bg-red-600 dark:bg-red-500" data-motion="progress" style={{ clipPath: `inset(0 ${100 - tankPercent}% 0 0)` }} />
      </div>
    </Card>
  );
}
