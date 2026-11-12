import { CalendarClock, Fuel, Gauge } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatLocalDateTime } from "@/lib/date";
import { formatDistance, formatVolume } from "@/lib/units";
import type { DistanceUnit, VolumeUnit } from "@/types";

interface PredictorProps { value: { remainingRangeKm: number; remainingVolumeLitres: number; currentTankPercent: number; expectedRefuelAt: string | null } | null; distanceUnit: DistanceUnit; volumeUnit: VolumeUnit }

export function NextFillPredictor({ value, distanceUnit, volumeUnit }: PredictorProps) {
  if (!value) return <Card><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">NEXT FILL-UP</p><p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Not enough full-tank history yet. Log at least two completed full-tank intervals to enable predictions.</p></Card>;
  return <Card><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">NEXT FILL-UP</p><div className="mt-4 grid grid-cols-3 gap-3"><div><Gauge className="size-5 text-red-500" strokeWidth={2}/><p className="mt-2 tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatDistance(value.remainingRangeKm, distanceUnit)}</p><p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">RANGE LEFT</p></div><div><Fuel className="size-5 text-red-500" strokeWidth={2}/><p className="mt-2 tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{value.currentTankPercent.toFixed(0)}%</p><p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">{formatVolume(value.remainingVolumeLitres, volumeUnit)} LEFT</p></div><div><CalendarClock className="size-5 text-red-500" strokeWidth={2}/><p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value.expectedRefuelAt ? formatLocalDateTime(value.expectedRefuelAt) : "—"}</p><p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">NEXT REFUEL</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><span className="block h-full rounded-full bg-red-600 dark:bg-red-500" style={{width:`${Math.max(0,Math.min(100,value.currentTankPercent))}%`}}/></div></Card>;
}
