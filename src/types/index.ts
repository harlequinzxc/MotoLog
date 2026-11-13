export type VehicleType = "car" | "motorcycle";
export type FuelType = "petrol" | "diesel" | "lpg" | "dual-fuel";
export type ActiveFuel = "petrol" | "diesel" | "lpg";
export type DistanceUnit = "km" | "miles";
export type VolumeUnit = "liters" | "gallons";
export type ConsumptionUnit = "km-per-litre" | "litres-per-100km" | "mpg-us" | "mpg-uk";
export type FillUpMode = "full" | "partial" | "missed";
export type ThemeMode = "dark" | "light";
export type ExpenseCategory = "insurance" | "road-tax" | "inspection" | "parking" | "tolls-erp" | "fines" | "wash" | "financing-coe" | "leasing" | "accessories" | "repairs" | "other";

export interface Vehicle { id: string; name: string; type: VehicleType; fuelType: FuelType; tankCapacityLitres: number; currentOdometerKm: number; distanceUnit: DistanceUnit; volumeUnit: VolumeUnit; consumptionUnit: ConsumptionUnit; currencyCode: string; createdAt: string; updatedAt: string; }
export interface FuelLog { id: string; vehicleId: string; occurredAt: string; odometerKm: number; activeFuel: ActiveFuel; mode: FillUpMode; pricePerLitre: number | null; volumeLitres: number | null; totalCost: number | null; currencyCode: string; stationName: string; notes: string; distanceKm: number | null; efficiencyKmPerLitre: number | null; createdAt: string; updatedAt: string; }
export interface ServiceRecord { id: string; vehicleId: string; occurredAt: string; title: string; totalCost: number; currencyCode: string; notes: string; }
export interface ServiceItem { id: string; vehicleId: string; title: string; isCustom: boolean; createdAt: string; updatedAt: string; }
export interface ServiceVisit { id: string; vehicleId: string; occurredAt: string; odometerKm: number; totalCost: number; currencyCode: string; notes: string; createdAt: string; updatedAt: string; }
export interface ServiceVisitItem { id: string; visitId: string; serviceItemId: string; createdAt: string; }
export interface ExpenseRecord { id: string; vehicleId: string; occurredAt: string; category: ExpenseCategory; totalCost: number; currencyCode: string; odometerKm: number | null; notes: string; createdAt: string; updatedAt: string; }
export interface AppSettings { id: "app"; activeVehicleId: string | null; themeMode: ThemeMode; reducedMotion: boolean | null; lastSeenVersion: string | null; createdAt: string; updatedAt: string; }

export interface VehicleInput { name: string; type: VehicleType; fuelType: FuelType; tankCapacityLitres: number; currentOdometerKm: number; distanceUnit: DistanceUnit; volumeUnit: VolumeUnit; consumptionUnit: ConsumptionUnit; currencyCode: string; }
export interface FuelLogInput { occurredAt: string; odometerKm: number; activeFuel: ActiveFuel; mode: FillUpMode; pricePerLitre: number | null; volumeLitres: number | null; totalCost: number | null; currencyCode: string; stationName: string; notes: string; }
export interface ServiceVisitInput { occurredAt: string; odometerKm: number; totalCost: number; currencyCode: string; notes: string; serviceItemIds: string[]; }
export interface ExpenseInput { occurredAt: string; category: ExpenseCategory; totalCost: number; currencyCode: string; odometerKm: number | null; notes: string; }
export interface AppSnapshot { vehicles: Vehicle[]; fuelLogs: FuelLog[]; serviceRecords: ServiceRecord[]; serviceItems: ServiceItem[]; serviceVisits: ServiceVisit[]; serviceVisitItems: ServiceVisitItem[]; expenseRecords: ExpenseRecord[]; settings: AppSettings | undefined; }
