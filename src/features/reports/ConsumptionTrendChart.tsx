import { Fuel } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { displayEfficiencyValue, formatDisplayedEfficiency } from "@/lib/units";
import type { ConsumptionUnit } from "@/types";
import type { ConsumptionPoint } from "@/utils/reportMetrics";

interface ConsumptionTrendChartProps {
  onLogFuel: () => void;
  points: ConsumptionPoint[];
  unit: ConsumptionUnit;
}

interface DisplayPoint extends ConsumptionPoint {
  value: number;
}

const WIDTH = 336;
const HEIGHT = 196;
const HORIZONTAL_PADDING = 30;
const VERTICAL_PADDING = 26;

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(iso));
}

function EmptyTrend({ onLogFuel }: { onLogFuel: () => void }) {
  return <EmptyState actionLabel="Log a Fill-Up" description="Complete a full-tank interval to plot fuel efficiency here." icon={Fuel} onAction={onLogFuel} title="No consumption trend yet" />;
}

export function ConsumptionTrendChart({ onLogFuel, points, unit }: ConsumptionTrendChartProps) {
  const displayPoints = points.flatMap<DisplayPoint>((point) => {
    const value = displayEfficiencyValue(point.efficiencyKmPerLitre, unit);
    return value === null ? [] : [{ ...point, value }];
  });

  if (displayPoints.length === 0) return <EmptyTrend onLogFuel={onLogFuel} />;

  const values = displayPoints.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max((maximum - minimum) * 0.18, maximum * 0.08, 0.5);
  const lowerBound = Math.max(0, minimum - padding);
  const upperBound = maximum + padding;
  const range = Math.max(upperBound - lowerBound, 1);
  const chartWidth = WIDTH - HORIZONTAL_PADDING * 2;
  const chartHeight = HEIGHT - VERTICAL_PADDING * 2;
  const pointPosition = (point: DisplayPoint, index: number) => ({
    x: displayPoints.length === 1 ? WIDTH / 2 : HORIZONTAL_PADDING + index / (displayPoints.length - 1) * chartWidth,
    y: VERTICAL_PADDING + (upperBound - point.value) / range * chartHeight
  });
  const positions = displayPoints.map(pointPosition);
  const path = positions.map((position, index) => `${index === 0 ? "M" : "L"} ${position.x} ${position.y}`).join(" ");

  return (
    <div className="motion-chart-enter grid gap-3" data-motion="consumption-chart" key={displayPoints.map((point) => `${point.id}-${point.value}`).join("-")}>
      <div className="overflow-hidden">
        <svg aria-label="Fuel efficiency trend" className="h-auto w-full" role="img" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <line x1={HORIZONTAL_PADDING} x2={WIDTH - HORIZONTAL_PADDING} y1={VERTICAL_PADDING} y2={VERTICAL_PADDING} stroke="currentColor" strokeDasharray="4 4" className="text-zinc-200 dark:text-zinc-800" />
          <line x1={HORIZONTAL_PADDING} x2={WIDTH - HORIZONTAL_PADDING} y1={HEIGHT - VERTICAL_PADDING} y2={HEIGHT - VERTICAL_PADDING} stroke="currentColor" strokeDasharray="4 4" className="text-zinc-200 dark:text-zinc-800" />
          <path d={path} fill="none" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {positions.map((position, index) => <circle cx={position.x} cy={position.y} fill="#ef4444" key={displayPoints[index].id} r="4" stroke="#ffffff" strokeWidth="2" className="dark:stroke-zinc-900" />)}
          <text className="tabular-nums fill-zinc-500 text-[10px] dark:fill-zinc-400" x={HORIZONTAL_PADDING} y="14">{formatDisplayedEfficiency(maximum, unit)}</text>
          <text className="tabular-nums fill-zinc-500 text-[10px] dark:fill-zinc-400" x={HORIZONTAL_PADDING} y={HEIGHT - 6}>{formatDisplayedEfficiency(minimum, unit)}</text>
        </svg>
      </div>
      <div className="flex justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="tabular-nums">{formatShortDate(displayPoints[0].occurredAt)}</span>
        {displayPoints.length > 1 ? <span className="tabular-nums">{formatShortDate(displayPoints[displayPoints.length - 1].occurredAt)}</span> : null}
      </div>
    </div>
  );
}
