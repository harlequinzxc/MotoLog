import type { FuelLog, Vehicle } from "@/types";

export type Timeframe = "30d" | "3m" | "1y" | "all";

function timeframeStart(timeframe: Timeframe, now = new Date()) {
  const start = new Date(now);
  if (timeframe === "30d") start.setDate(start.getDate() - 30);
  if (timeframe === "3m") start.setMonth(start.getMonth() - 3);
  if (timeframe === "1y") start.setFullYear(start.getFullYear() - 1);
  return timeframe === "all" ? null : start;
}

export function logsForTimeframe(logs: FuelLog[], timeframe: Timeframe, now = new Date()) {
  const start = timeframeStart(timeframe, now);
  return start ? logs.filter((log) => new Date(log.occurredAt) >= start) : logs;
}

export function efficiencyMetrics(logs: FuelLog[]) {
  const values = logs.flatMap((log) => log.efficiencyKmPerLitre === null ? [] : [log.efficiencyKmPerLitre]);
  if (values.length === 0) return { average: null, best: null, worst: null, trendPercent: null };
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  const best = Math.max(...values), worst = Math.min(...values);
  const split = Math.floor(values.length / 2);
  const prior = split > 0 ? values.slice(split).reduce((total, value) => total + value, 0) / values.slice(split).length : null;
  const recent = split > 0 ? values.slice(0, split).reduce((total, value) => total + value, 0) / values.slice(0, split).length : null;
  const trendPercent = prior && recent ? ((recent - prior) / prior) * 100 : null;
  return { average, best, worst, trendPercent };
}

export function nextFillPredictor(vehicle: Vehicle, logs: FuelLog[], now = new Date()) {
  const ordered = [...logs].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const efficiencies = ordered.flatMap((log) => log.efficiencyKmPerLitre === null ? [] : [log.efficiencyKmPerLitre]);
  const latestFull = [...ordered].reverse().find((log) => log.mode === "full");
  if (!latestFull || efficiencies.length < 2) return null;
  const rollingAverage = efficiencies.slice(-5).reduce((total, value) => total + value, 0) / Math.min(efficiencies.length, 5);
  const drivenSinceFull = Math.max(vehicle.currentOdometerKm - latestFull.odometerKm, 0);
  const theoreticalRange = vehicle.tankCapacityLitres * rollingAverage;
  const remainingRangeKm = Math.max(theoreticalRange - drivenSinceFull, 0);
  const remainingVolumeLitres = Math.max(vehicle.tankCapacityLitres - drivenSinceFull / rollingAverage, 0);
  const lastDated = ordered.length >= 2 ? ordered[ordered.length - 2] : null;
  if (!lastDated) return null;
  const elapsedDays = Math.max((new Date(latestFull.occurredAt).getTime() - new Date(lastDated.occurredAt).getTime()) / 86_400_000, 1);
  const averageDailyDistanceKm = Math.max((latestFull.odometerKm - lastDated.odometerKm) / elapsedDays, 0);
  const expectedRefuelAt = averageDailyDistanceKm > 0 ? new Date(now.getTime() + remainingRangeKm / averageDailyDistanceKm * 86_400_000).toISOString() : null;
  return { rollingAverage, remainingRangeKm, remainingVolumeLitres, currentTankPercent: vehicle.tankCapacityLitres > 0 ? remainingVolumeLitres / vehicle.tankCapacityLitres * 100 : 0, expectedRefuelAt, averageDailyDistanceKm };
}
