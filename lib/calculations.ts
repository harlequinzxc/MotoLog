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
