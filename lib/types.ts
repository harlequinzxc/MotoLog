/** MotoLog stores every distance in kilometres and every fuel volume in litres. */
export type VehicleType = "motorcycle" | "car";

export type DistanceUnit = "km" | "mi";
export type VolumeUnit = "L" | "gal-us" | "gal-uk";
export type ConsumptionUnit = "km/L" | "L/100km" | "mpg-us" | "mpg-uk";

export interface UnitPreference {
  distance: DistanceUnit;
  volume: VolumeUnit;
  consumption: ConsumptionUnit;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  year: number | null;
  /** Litres — source data remains metric even when the UI uses another unit. */
  tankCapacity: number;
  /** Litres available after the main tank range is exhausted. */
  reserve: number;
  /** Kilometres. */
  startingOdometer: number;
  /** Kilometres; kept in sync with the highest recorded fill-up. */
  currentOdometer: number;
  /** Null means the vehicle inherits the app-wide display unit settings. */
  unitPreference: Partial<UnitPreference> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FillUp {
  id: string;
  vehicleId: string;
  /** ISO calendar date, for example `2026-08-26`. */
  date: string;
  /** Kilometres. */
  odometer: number;
  /** Litres. */
  fuelAdded: number;
  /** Stored in the selected currency's nominal value. */
  totalCost: number;
  isFullTank: boolean;
  station: string;
  notes: string;
  /** Kilometres travelled since the prior fill-up, when known. */
  distance: number | null;
  /** km/L. Partial fill-ups intentionally have no standalone economy value. */
  economy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  consumptionUnit: ConsumptionUnit;
  /** Kept with settings for future backup/restore; ThemeProvider applies it. */
  accentTheme: string;
}

export interface VehicleInput {
  type: VehicleType;
  name: string;
  year?: number | null;
  tankCapacity: number;
  reserve?: number;
  startingOdometer?: number;
  currentOdometer?: number;
  unitPreference?: Partial<UnitPreference> | null;
  isActive?: boolean;
}

export interface FillUpInput {
  vehicleId: string;
  date: string;
  odometer: number;
  fuelAdded: number;
  totalCost: number;
  isFullTank: boolean;
  station?: string;
  notes?: string;
  distance?: number | null;
  economy?: number | null;
}

export interface AppData {
  vehicles: Vehicle[];
  fillUps: FillUp[];
  settings: AppSettings;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  currency: "SGD",
  currencySymbol: "S$",
  distanceUnit: "km",
  volumeUnit: "L",
  consumptionUnit: "km/L",
  accentTheme: "orange",
};
