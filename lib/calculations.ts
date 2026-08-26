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
  // The first recorded pump is a baseline: we do not know the fuel level
  // before it, so neither its distance nor its fuel should affect economy.
  if (priorFillUps.length === 0) {
    return { distance: null, economy: null };
  }

  const previousFillUp = priorFillUps[priorFillUps.length - 1];
  const distance =
    Number.isFinite(odometer) && odometer >= previousFillUp.odometer
      ? odometer - previousFillUp.odometer
      : null;

  if (!isFullTank) {
    return { distance, economy: null };
  }

  // Index zero is always the baseline, even when that original log happened
  // to be marked as a full tank. Do not include its fuel in later math.
  let lastFullFillIndex = -1;
  for (let index = priorFillUps.length - 1; index >= 1; index -= 1) {
    if (priorFillUps[index].isFullTank) {
      lastFullFillIndex = index;
      break;
    }
  }
  const baselineFillUp = priorFillUps[0];
  const economyAnchorOdometer =
    lastFullFillIndex === -1
      ? baselineFillUp.odometer
      : priorFillUps[lastFullFillIndex].odometer;
  const firstFuelIndex = lastFullFillIndex === -1 ? 1 : lastFullFillIndex + 1;
  const fuelSinceLastFull = priorFillUps
    .slice(firstFuelIndex)
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

/**
 * Rebuilds distance and economy values for one vehicle in chronological order.
 * This is used after a historical edit or deletion so every later entry remains
 * mathematically consistent with partial-fill fuel accumulation.
 */
export function recalculateVehicleFillUps(
  vehicle: Vehicle,
  fillUps: FillUp[],
): FillUp[] {
  const ordered = fillUps
    .filter((fillUp) => fillUp.vehicleId === vehicle.id)
    .sort(
      (first, second) =>
        first.date.localeCompare(second.date) ||
        first.odometer - second.odometer ||
        first.createdAt.localeCompare(second.createdAt),
    );
  const recalculated = new Map<string, FillUp>();
  let previousOdometer = vehicle.startingOdometer;
  let lastFullOdometer: number | null = null;
  let fuelSinceLastFull = 0;

  ordered.forEach((fillUp, index) => {
    // The earliest log establishes a trustworthy odometer/fuel baseline only.
    // It is never itself used as a trip or economy calculation.
    if (index === 0) {
      recalculated.set(fillUp.id, {
        ...fillUp,
        distance: null,
        economy: null,
      });
      previousOdometer = fillUp.odometer;
      lastFullOdometer = fillUp.odometer;
      fuelSinceLastFull = 0;
      return;
    }

    const distance =
      Number.isFinite(fillUp.odometer) && fillUp.odometer >= previousOdometer
        ? fillUp.odometer - previousOdometer
        : null;
    const validFuel =
      Number.isFinite(fillUp.fuelAdded) && fillUp.fuelAdded > 0
        ? fillUp.fuelAdded
        : 0;
    let economy: number | null = null;

    if (fillUp.isFullTank) {
      economy = calculateEconomy(
        fillUp.odometer - (lastFullOdometer ?? previousOdometer),
        fuelSinceLastFull + validFuel,
      );
      lastFullOdometer = fillUp.odometer;
      fuelSinceLastFull = 0;
    } else {
      fuelSinceLastFull += validFuel;
    }

    recalculated.set(fillUp.id, {
      ...fillUp,
      distance,
      economy,
    });
    previousOdometer = fillUp.odometer;
  });

  return fillUps.map((fillUp) => recalculated.get(fillUp.id) ?? fillUp);
}
