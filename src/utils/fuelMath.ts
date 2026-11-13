import type { FuelLog } from "@/types";

export function calculateThirdField(
  pricePerUnit: number | null,
  volume: number | null,
  totalCost: number | null,
  target: "price" | "volume" | "total"
) {
  if (target === "price" && volume !== null && volume > 0 && totalCost !== null) return totalCost / volume;
  if (target === "volume" && pricePerUnit !== null && pricePerUnit > 0 && totalCost !== null) return totalCost / pricePerUnit;
  if (target === "total" && pricePerUnit !== null && volume !== null) return pricePerUnit * volume;
  return null;
}

/**
 * Rebuilds mileage safely for each active fuel stream. First and missed logs
 * become baselines. Partial logs accumulate litres until a later full log.
 */
export function recalculateFuelLogs(logs: FuelLog[]) {
  const byFuel = new Map<string, FuelLog[]>();
  logs.forEach((log) => {
    const key = `${log.vehicleId}:${log.activeFuel}`;
    const group = byFuel.get(key) ?? [];
    group.push(log);
    byFuel.set(key, group);
  });
  const recalculated = new Map<string, FuelLog>();

  byFuel.forEach((group) => {
    const ordered = [...group].sort((first, second) => first.occurredAt.localeCompare(second.occurredAt) || first.odometerKm - second.odometerKm);
    let previousOdometer: number | null = null;
    let intervalBaselineOdometer: number | null = null;
    let partialLitres = 0;

    ordered.forEach((log, index) => {
      const pricePerLitre = log.volumeLitres !== null && log.volumeLitres > 0 && log.totalCost !== null ? log.totalCost / log.volumeLitres : null;
      if (index === 0 || log.mode === "missed") {
        recalculated.set(log.id, { ...log, pricePerLitre, distanceKm: null, efficiencyKmPerLitre: null });
        previousOdometer = log.odometerKm;
        intervalBaselineOdometer = log.odometerKm;
        partialLitres = 0;
        return;
      }

      const distanceKm = previousOdometer !== null && log.odometerKm >= previousOdometer ? log.odometerKm - previousOdometer : null;
      let efficiencyKmPerLitre: number | null = null;
      const litres = log.volumeLitres !== null && log.volumeLitres > 0 ? log.volumeLitres : 0;
      if (log.mode === "partial") {
        partialLitres += litres;
      } else {
        const intervalDistance = intervalBaselineOdometer !== null && log.odometerKm >= intervalBaselineOdometer ? log.odometerKm - intervalBaselineOdometer : null;
        const intervalLitres = partialLitres + litres;
        efficiencyKmPerLitre = intervalDistance !== null && intervalDistance > 0 && intervalLitres > 0 ? intervalDistance / intervalLitres : null;
        intervalBaselineOdometer = log.odometerKm;
        partialLitres = 0;
      }
      recalculated.set(log.id, { ...log, pricePerLitre, distanceKm, efficiencyKmPerLitre });
      previousOdometer = log.odometerKm;
    });
  });

  return logs.map((log) => recalculated.get(log.id) ?? log);
}
