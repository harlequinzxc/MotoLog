import type { FillUp, Vehicle } from "@/lib/types";

export interface RangeBreakdown {
  mainRange: number;
  reserveRange: number;
  totalRange: number;
}

function isPositiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}

/** Returns fuel economy in km/L, or null when either input cannot form a rate. */
export function calculateEconomy(
  distanceKilometres: number,
  fuelLitres: number,
): number | null {
  if (!isPositiveFinite(distanceKilometres) || !isPositiveFinite(fuelLitres)) {
    return null;
  }

  return distanceKilometres / fuelLitres;
}

/** Returns the estimated total kilometres available from the given fuel volume. */
export function calculateRange(
  tankCapacityLitres: number,
  economyKmPerLitre: number,
): number | null {
  if (!isPositiveFinite(tankCapacityLitres) || !isPositiveFinite(economyKmPerLitre)) {
    return null;
  }

  return tankCapacityLitres * economyKmPerLitre;
}

/** Splits estimated range into main-tank and reserve portions for the dashboard. */
export function calculateRangeBreakdown(
  tankCapacityLitres: number,
  reserveLitres: number,
  economyKmPerLitre: number,
): RangeBreakdown | null {
  const totalRange = calculateRange(tankCapacityLitres, economyKmPerLitre);

  if (totalRange === null) {
    return null;
  }

  const usableReserve = Number.isFinite(reserveLitres)
    ? Math.min(Math.max(reserveLitres, 0), tankCapacityLitres)
    : 0;
  const mainRange = calculateRange(
    tankCapacityLitres - usableReserve,
    economyKmPerLitre,
  );
  const reserveRange = calculateRange(usableReserve, economyKmPerLitre);

  return {
    mainRange: mainRange ?? 0,
    reserveRange: reserveRange ?? 0,
    totalRange,
  };
}

export interface FillUpMetrics {
  /** Distance since the immediately preceding fill-up, in kilometres. */
  distance: number | null;
  /** Economy in km/L. Partial fills deliberately return null. */
  economy: number | null;
}

export interface FillUpMetricsInput {
  existingFillUps: FillUp[];
  fuelAdded: number;
  isFullTank: boolean;
  odometer: number;
  vehicle: Vehicle;
}

/**
 * Calculates the data attached to a newly logged fill-up.
 *
 * A partial fill cannot measure economy on its own. When the next full fill is
 * logged, fuel from every partial since the preceding full fill is accumulated
 * and divided into the full distance travelled over that same period.
 */
export function calculateFillUpMetrics({
  existingFillUps,
  fuelAdded,
  isFullTank,
  odometer,
  vehicle,
}: FillUpMetricsInput): FillUpMetrics {
  const priorFillUps = existingFillUps
    .filter(
      (fillUp) =>
        fillUp.vehicleId === vehicle.id &&
        Number.isFinite(fillUp.odometer) &&
        fillUp.odometer <= odometer,
    )
    .sort(
      (first, second) =>
        first.odometer - second.odometer || first.date.localeCompare(second.date),
    );
  const previousFillUp = priorFillUps[priorFillUps.length - 1];
  const previousOdometer = previousFillUp?.odometer ?? vehicle.startingOdometer;
  const distance =
    Number.isFinite(odometer) && odometer >= previousOdometer
      ? odometer - previousOdometer
      : null;

  if (!isFullTank) {
    return { distance, economy: null };
  }

  let lastFullFillIndex = -1;
  for (let index = priorFillUps.length - 1; index >= 0; index -= 1) {
    if (priorFillUps[index].isFullTank) {
      lastFullFillIndex = index;
      break;
    }
  }
  const economyAnchorOdometer =
    lastFullFillIndex === -1
      ? vehicle.startingOdometer
      : priorFillUps[lastFullFillIndex].odometer;
  const fuelSinceLastFull = priorFillUps
    .slice(lastFullFillIndex + 1)
    .reduce(
      (totalFuel, fillUp) =>
        Number.isFinite(fillUp.fuelAdded) && fillUp.fuelAdded > 0
          ? totalFuel + fillUp.fuelAdded
          : totalFuel,
      fuelAdded,
    );

  return {
    distance,
    economy: calculateEconomy(odometer - economyAnchorOdometer, fuelSinceLastFull),
  };
}
