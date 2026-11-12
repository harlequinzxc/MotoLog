import type { ConsumptionUnit, DistanceUnit, VolumeUnit } from "@/types";

const KM_PER_MILE = 1.609344;
const L_PER_US_GALLON = 3.785411784;
const L_PER_UK_GALLON = 4.54609;

export function fromKilometres(value: number, unit: DistanceUnit) { return unit === "miles" ? value / KM_PER_MILE : value; }
export function toKilometres(value: number, unit: DistanceUnit) { return unit === "miles" ? value * KM_PER_MILE : value; }
export function fromLitres(value: number, unit: VolumeUnit) { return unit === "gallons" ? value / L_PER_US_GALLON : value; }
export function toLitres(value: number, unit: VolumeUnit) { return unit === "gallons" ? value * L_PER_US_GALLON : value; }
export function formatDistance(kilometres: number, unit: DistanceUnit) { return `${fromKilometres(kilometres, unit).toFixed(0)} ${unit === "miles" ? "mi" : "km"}`; }
export function formatVolume(litres: number, unit: VolumeUnit) { return `${fromLitres(litres, unit).toFixed(2)} ${unit === "gallons" ? "gal" : "L"}`; }
export function formatEfficiency(kmPerLitre: number | null, unit: ConsumptionUnit) {
  if (kmPerLitre === null || kmPerLitre <= 0) return "—";
  if (unit === "litres-per-100km") return `${(100 / kmPerLitre).toFixed(1)} L/100km`;
  if (unit === "mpg-us") return `${((kmPerLitre * L_PER_US_GALLON) / KM_PER_MILE).toFixed(1)} MPG US`;
  if (unit === "mpg-uk") return `${((kmPerLitre * L_PER_UK_GALLON) / KM_PER_MILE).toFixed(1)} MPG UK`;
  return `${kmPerLitre.toFixed(1)} km/L`;
}
