import type { FuelLog } from "@/types";

export function calculatePricePerLitre(totalCost: number, litres: number) {
  if (!Number.isFinite(totalCost) || !Number.isFinite(litres) || litres <= 0) return null;
  return totalCost / litres;
}

/**
 * Recomputes log distances and full-tank efficiency. The first record is a
 * baseline, partial fills accumulate litres, and the next full tank closes the interval.
 */
export function recalculateFuelLogs(logs: FuelLog[]): FuelLog[] {
  const ordered = [...logs].sort(
    (first, second) =>
      first.occurredAt.localeCompare(second.occurredAt) ||
      first.odometerKm - second.odometerKm ||
      first.createdAt.localeCompare(second.createdAt)
  );
  const recalculated = new Map<string, FuelLog>();
  let previousOdometer: number | null = null;
  let lastFullOdometer: number | null = null;
  let accumulatedPartialLitres = 0;

  ordered.forEach((log, index) => {
    const validLitres = Number.isFinite(log.litres) && log.litres > 0 ? log.litres : 0;
    const pricePerLitre = calculatePricePerLitre(log.totalCost, log.litres);

    if (index === 0) {
      recalculated.set(log.id, {
        ...log,
        pricePerLitre,
        distanceKm: null,
        efficiencyKmPerLitre: null
      });
      previousOdometer = log.odometerKm;
      lastFullOdometer = log.odometerKm;
      return;
    }

    const distanceKm =
      previousOdometer !== null && log.odometerKm >= previousOdometer
        ? log.odometerKm - previousOdometer
        : null;
    let efficiencyKmPerLitre: number | null = null;

    if (log.isPartial) {
      accumulatedPartialLitres += validLitres;
    } else {
      const intervalDistance =
        lastFullOdometer !== null && log.odometerKm >= lastFullOdometer
          ? log.odometerKm - lastFullOdometer
          : null;
      const intervalLitres = accumulatedPartialLitres + validLitres;
      efficiencyKmPerLitre =
        intervalDistance !== null && intervalDistance > 0 && intervalLitres > 0
          ? intervalDistance / intervalLitres
          : null;
      lastFullOdometer = log.odometerKm;
      accumulatedPartialLitres = 0;
    }

    recalculated.set(log.id, {
      ...log,
      pricePerLitre,
      distanceKm,
      efficiencyKmPerLitre
    });
    previousOdometer = log.odometerKm;
  });

  return logs.map((log) => recalculated.get(log.id) ?? log);
}

export function displayEfficiency(kilometresPerLitre: number | null, unit: "km-per-litre" | "litres-per-100km") {
  if (kilometresPerLitre === null || kilometresPerLitre <= 0) return "—";
  return unit === "km-per-litre"
    ? `${kilometresPerLitre.toFixed(1)} km/L`
    : `${(100 / kilometresPerLitre).toFixed(1)} L/100km`;
}
