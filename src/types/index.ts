export type VehicleType = "car" | "motorcycle";
export type FuelType = "petrol" | "diesel" | "lpg" | "dual-fuel";
export type ActiveFuel = "petrol" | "diesel" | "lpg";
export type DistanceUnit = "km" | "miles";
export type VolumeUnit = "liters" | "gallons";
export type ConsumptionUnit = "km-per-litre" | "litres-per-100km" | "mpg-us" | "mpg-uk";
export type FillUpMode = "full" | "partial" | "missed";
export type ThemeMode = "dark" | "light";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  fuelType: FuelType;
  tankCapacityLitres: number;
  currentOdometerKm: number;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  consumptionUnit: ConsumptionUnit;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  occurredAt: string;
  odometerKm: number;
  activeFuel: ActiveFuel;
  mode: FillUpMode;
  pricePerLitre: number | null;
  volumeLitres: number | null;
  totalCost: number | null;
  currencyCode: string;
  stationName: string;
  notes: string;
  distanceKm: number | null;
  efficiencyKmPerLitre: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  occurredAt: string;
  title: string;
  totalCost: number;
  currencyCode: string;
  notes: string;
}

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  occurredAt: string;
  category: "parking" | "erp" | "other";
  totalCost: number;
  currencyCode: string;
  notes: string;
}

export interface AppSettings {
  id: "app";
  activeVehicleId: string | null;
  themeMode: ThemeMode;
  lastSeenVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  name: string;
  type: VehicleType;
  fuelType: FuelType;
  tankCapacityLitres: number;
  currentOdometerKm: number;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  consumptionUnit: ConsumptionUnit;
  currencyCode: string;
}

export interface FuelLogInput {
  occurredAt: string;
  odometerKm: number;
  activeFuel: ActiveFuel;
  mode: FillUpMode;
  pricePerLitre: number | null;
  volumeLitres: number | null;
  totalCost: number | null;
  currencyCode: string;
  stationName: string;
  notes: string;
}

export interface AppSnapshot {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  serviceRecords: ServiceRecord[];
  expenseRecords: ExpenseRecord[];
  settings: AppSettings | undefined;
}
