import Dexie, { type EntityTable } from "dexie";
import { createId } from "@/lib/id";
import { recalculateFuelLogs } from "@/utils/fuelMath";
import type { AppSettings, AppSnapshot, ExpenseRecord, FuelLog, FuelLogInput, ServiceRecord, Vehicle, VehicleInput } from "@/types";

export class MotoLogDB extends Dexie {
  vehicles!: EntityTable<Vehicle, "id">;
  fuelLogs!: EntityTable<FuelLog, "id">;
  serviceRecords!: EntityTable<ServiceRecord, "id">;
  expenseRecords!: EntityTable<ExpenseRecord, "id">;
  settings!: EntityTable<AppSettings, "id">;
  constructor() { super("MotoLogDB"); this.version(1).stores({ vehicles: "id,type,createdAt", fuelLogs: "id,vehicleId,occurredAt,[vehicleId+occurredAt]", serviceRecords: "id,vehicleId,occurredAt", expenseRecords: "id,vehicleId,occurredAt", settings: "id" }); }
}
export const db = new MotoLogDB();

export async function ensureSettings() {
  const existing = await db.settings.get("app");
  if (existing) return existing;
  const timestamp = new Date().toISOString();
  const settings: AppSettings = { id: "app", activeVehicleId: null, themeMode: "dark", lastSeenVersion: null, createdAt: timestamp, updatedAt: timestamp };
  await db.settings.put(settings);
  return settings;
}

export async function createVehicle(input: VehicleInput) {
  const timestamp = new Date().toISOString();
  const vehicle: Vehicle = { id: createId("vehicle"), name: input.name.trim(), type: input.type, fuelType: input.fuelType, tankCapacityLitres: input.tankCapacityLitres, currentOdometerKm: input.currentOdometerKm, distanceUnit: input.distanceUnit, volumeUnit: input.volumeUnit, consumptionUnit: input.consumptionUnit, currencyCode: input.currencyCode, createdAt: timestamp, updatedAt: timestamp };
  await db.transaction("rw", db.vehicles, db.settings, async () => { await db.vehicles.add(vehicle); const settings = await ensureSettings(); if (!settings.activeVehicleId) await db.settings.update("app", { activeVehicleId: vehicle.id, updatedAt: timestamp }); });
  return vehicle;
}
export async function updateVehicle(id: string, input: VehicleInput) { await db.vehicles.update(id, { ...input, name: input.name.trim(), updatedAt: new Date().toISOString() }); }
export async function setActiveVehicle(id: string) { await db.settings.update("app", { activeVehicleId: id, updatedAt: new Date().toISOString() }); }

export async function createFuelLog(vehicleId: string, input: FuelLogInput) {
  const timestamp = new Date().toISOString();
  const log: FuelLog = { id: createId("fuel"), vehicleId, ...input, stationName: input.stationName.trim(), notes: input.notes.trim(), pricePerLitre: null, distanceKm: null, efficiencyKmPerLitre: null, createdAt: timestamp, updatedAt: timestamp };
  const logs = await db.fuelLogs.where("vehicleId").equals(vehicleId).toArray();
  await saveRecalculatedLogs(vehicleId, [...logs, log]);
}
export async function updateFuelLog(id: string, input: FuelLogInput) {
  const current = await db.fuelLogs.get(id); if (!current) throw new Error("Fuel log not found.");
  const updated: FuelLog = { ...current, ...input, stationName: input.stationName.trim(), notes: input.notes.trim(), pricePerLitre: null, distanceKm: null, efficiencyKmPerLitre: null, updatedAt: new Date().toISOString() };
  const logs = (await db.fuelLogs.where("vehicleId").equals(current.vehicleId).toArray()).filter((log) => log.id !== id);
  await saveRecalculatedLogs(current.vehicleId, [...logs, updated]);
}
export async function deleteFuelLog(id: string) {
  const current = await db.fuelLogs.get(id); if (!current) return undefined;
  const snapshot = await readSnapshot();
  const logs = await db.fuelLogs.where("vehicleId").equals(current.vehicleId).toArray();
  await saveRecalculatedLogs(current.vehicleId, logs.filter((log) => log.id !== id));
  return snapshot;
}
async function saveRecalculatedLogs(vehicleId: string, logs: FuelLog[]) {
  const recalculated = recalculateFuelLogs(logs);
  await db.transaction("rw", db.fuelLogs, db.vehicles, async () => {
    await db.fuelLogs.where("vehicleId").equals(vehicleId).delete();
    await db.fuelLogs.bulkPut(recalculated);
    const highest = recalculated.reduce((value, log) => Math.max(value, log.odometerKm), 0);
    const vehicle = await db.vehicles.get(vehicleId);
    if (vehicle && highest > vehicle.currentOdometerKm) await db.vehicles.update(vehicleId, { currentOdometerKm: highest, updatedAt: new Date().toISOString() });
  });
}
export async function updateSettings(changes: Partial<Omit<AppSettings, "id" | "createdAt">>) { await db.settings.update("app", { ...changes, updatedAt: new Date().toISOString() }); }
export async function readSnapshot(): Promise<AppSnapshot> { return { vehicles: await db.vehicles.toArray(), fuelLogs: await db.fuelLogs.toArray(), serviceRecords: await db.serviceRecords.toArray(), expenseRecords: await db.expenseRecords.toArray(), settings: await db.settings.get("app") }; }
export async function restoreSnapshot(snapshot: AppSnapshot) { await db.transaction("rw", db.vehicles, db.fuelLogs, db.serviceRecords, db.expenseRecords, db.settings, async () => { await db.vehicles.bulkPut(snapshot.vehicles); await db.fuelLogs.bulkPut(snapshot.fuelLogs); await db.serviceRecords.bulkPut(snapshot.serviceRecords); await db.expenseRecords.bulkPut(snapshot.expenseRecords); if (snapshot.settings) await db.settings.put(snapshot.settings); }); }
export async function clearAllData() { const snapshot = await readSnapshot(); await db.transaction("rw", db.vehicles, db.fuelLogs, db.serviceRecords, db.expenseRecords, db.settings, async () => { await db.vehicles.clear(); await db.fuelLogs.clear(); await db.serviceRecords.clear(); await db.expenseRecords.clear(); await db.settings.clear(); }); return snapshot; }
