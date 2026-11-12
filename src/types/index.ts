export type VehicleType = "car" | "motorcycle";
export type CurrencyCode = "SGD" | "MYR";
export type EfficiencyUnit = "km-per-litre" | "litres-per-100km";
export type ThemeMode = "dark" | "light";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  tankCapacityLitres: number;
  currentOdometerKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  occurredAt: string;
  odometerKm: number;
  litres: number;
  totalCost: number;
  currencyCode: CurrencyCode;
  station: string;
  isPartial: boolean;
  pricePerLitre: number | null;
  distanceKm: number | null;
  efficiencyKmPerLitre: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: "app";
  activeVehicleId: string | null;
  themeMode: ThemeMode;
  efficiencyUnit: EfficiencyUnit;
  lastSeenVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  name: string;
  type: VehicleType;
  tankCapacityLitres: number;
  currentOdometerKm: number;
}

export interface FuelLogInput {
  occurredAt: string;
  odometerKm: number;
  litres: number;
  totalCost: number;
  currencyCode: CurrencyCode;
  station: string;
  isPartial: boolean;
  notes: string;
}

export interface AppSnapshot {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  settings: AppSettings | undefined;
}
