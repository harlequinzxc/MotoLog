import type {
  AppSettings,
  ConsumptionUnit,
  DistanceUnit,
  UnitPreference,
  Vehicle,
  VolumeUnit,
} from "@/lib/types";

export const KILOMETRES_PER_MILE = 1.609_344;
export const LITRES_PER_US_GALLON = 3.785_411_784;
export const LITRES_PER_UK_GALLON = 4.546_09;

export interface ResolvedUnits extends UnitPreference {
  distanceLabel: string;
  economyLabel: string;
  volumeLabel: string;
}

function volumeFactor(unit: VolumeUnit) {
  switch (unit) {
    case "gal-us":
      return LITRES_PER_US_GALLON;
    case "gal-uk":
      return LITRES_PER_UK_GALLON;
    default:
      return 1;
  }
}

function distanceLabel(unit: DistanceUnit) {
  return unit === "mi" ? "mi" : "km";
}

function volumeLabel(unit: VolumeUnit) {
  switch (unit) {
    case "gal-us":
      return "US gal";
    case "gal-uk":
      return "UK gal";
    default:
      return "L";
  }
}

function economyLabel(unit: ConsumptionUnit) {
  switch (unit) {
    case "L/100km":
      return "L/100km";
    case "mpg-us":
      return "MPG (US)";
    case "mpg-uk":
      return "MPG (UK)";
    default:
      return "km/L";
  }
}

/** Merges app defaults with a vehicle-level override. Source values remain metric. */
export function resolveUnits(
  settings: AppSettings,
  vehicle?: Pick<Vehicle, "unitPreference"> | null,
): ResolvedUnits {
  const preference = vehicle?.unitPreference;
  const distance = preference?.distance ?? settings.distanceUnit;
  const volume = preference?.volume ?? settings.volumeUnit;
  const consumption = preference?.consumption ?? settings.consumptionUnit;

  return {
    distance,
    volume,
    consumption,
    distanceLabel: distanceLabel(distance),
    volumeLabel: volumeLabel(volume),
    economyLabel: economyLabel(consumption),
  };
}

/** Converts persisted kilometres to the requested display distance. */
export function fromKilometres(kilometres: number, unit: DistanceUnit) {
  return unit === "mi" ? kilometres / KILOMETRES_PER_MILE : kilometres;
}

/** Converts a display distance back to persisted kilometres. */
export function toKilometres(distance: number, unit: DistanceUnit) {
  return unit === "mi" ? distance * KILOMETRES_PER_MILE : distance;
}

/** Converts persisted litres to the requested display volume. */
export function fromLitres(litres: number, unit: VolumeUnit) {
  return litres / volumeFactor(unit);
}

/** Converts a display volume back to persisted litres. */
export function toLitres(volume: number, unit: VolumeUnit) {
  return volume * volumeFactor(unit);
}

/** Converts persisted km/L to the requested consumption representation. */
export function fromKilometresPerLitre(
  kilometresPerLitre: number,
  unit: ConsumptionUnit,
) {
  if (!Number.isFinite(kilometresPerLitre) || kilometresPerLitre <= 0) {
    return null;
  }

  switch (unit) {
    case "L/100km":
      return 100 / kilometresPerLitre;
    case "mpg-us":
      return (kilometresPerLitre * LITRES_PER_US_GALLON) / KILOMETRES_PER_MILE;
    case "mpg-uk":
      return (kilometresPerLitre * LITRES_PER_UK_GALLON) / KILOMETRES_PER_MILE;
    default:
      return kilometresPerLitre;
  }
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

export function formatDistance(kilometres: number, units: ResolvedUnits) {
  return `${formatNumber(fromKilometres(kilometres, units.distance))} ${units.distanceLabel}`;
}

export function formatVolume(litres: number, units: ResolvedUnits) {
  return `${formatNumber(fromLitres(litres, units.volume))} ${units.volumeLabel}`;
}

export function formatEconomy(
  kilometresPerLitre: number | null,
  units: ResolvedUnits,
) {
  const value =
    kilometresPerLitre === null
      ? null
      : fromKilometresPerLitre(kilometresPerLitre, units.consumption);

  return value === null ? "—" : `${formatNumber(value)} ${units.economyLabel}`;
}
