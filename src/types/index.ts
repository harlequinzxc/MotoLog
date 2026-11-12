export type VehicleType = "car" | "motorcycle";
export type ThemeMode = "dark" | "light";
export type CurrencyCode = "SGD" | "MYR";
export type BillingCycle = "monthly" | "six-monthly" | "annual";
export type FixedCostCategory = "road-tax" | "insurance" | "season-parking" | "coe" | "loan";
export type TripPurpose = "business" | "personal";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  makeModel: string;
  plateNumber: string;
  year: number | null;
  defaultFuelGrade: string;
  tankCapacityLitres: number;
  currentOdometerKm: number;
  homeCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  occurredAt: string;
  odometerKm: number;
  fuelVolumeLitres: number;
  totalCost: number;
  currencyCode: CurrencyCode;
  stationName: string;
  fuelGrade: string;
  isFullTank: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripLog {
  id: string;
  vehicleId: string;
  occurredAt: string;
  purpose: TripPurpose;
  distanceKm: number;
  erpCost: number;
  parkingCost: number;
  currencyCode: CurrencyCode;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  title: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastServicedAt: string | null;
  lastServicedOdometerKm: number | null;
  dueAt: string | null;
  dueOdometerKm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceHistory {
  id: string;
  vehicleId: string;
  maintenanceItemId: string | null;
  completedAt: string;
  odometerKm: number;
  totalCost: number;
  currencyCode: CurrencyCode;
  notes: string;
  createdAt: string;
}

export interface FixedCost {
  id: string;
  vehicleId: string;
  category: FixedCostCategory;
  label: string;
  amount: number;
  currencyCode: CurrencyCode;
  billingCycle: BillingCycle;
  renewalAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: "app";
  activeVehicleId: string | null;
  themeMode: ThemeMode;
  homeCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  name: string;
  type: VehicleType;
  makeModel: string;
  plateNumber: string;
  year: number | null;
  defaultFuelGrade: string;
  tankCapacityLitres: number;
  currentOdometerKm: number;
}

export interface FixedCostInput {
  category: FixedCostCategory;
  label: string;
  amount: number;
  billingCycle: BillingCycle;
  renewalAt: string;
}

export interface AppSnapshot {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  tripLogs: TripLog[];
  maintenanceItems: MaintenanceItem[];
  serviceHistory: ServiceHistory[];
  fixedCosts: FixedCost[];
  settings: AppSettings | undefined;
}
