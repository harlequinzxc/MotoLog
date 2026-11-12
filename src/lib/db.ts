import Dexie, { type EntityTable } from "dexie";

import { createId } from "@/lib/id";
import { recalculateFuelLogs } from "@/utils/fuelMath";
import type { AppSettings, AppSnapshot, FuelLog, FuelLogInput, Vehicle, VehicleInput } from "@/types";

export class MotoLogDB extends Dexie {
  vehicles!: EntityTable<Vehicle, "id">;
  fuelLogs!: EntityTable<FuelLog, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("MotoLogDB");
    this.version(1).stores({
      vehicles: "id, type, createdAt, updatedAt",
      fuelLogs: "id, vehicleId, occurredAt, [vehicleId+occurredAt]",
      settings: "id"
    });
  }
}

export const db = new MotoLogDB();

export async function ensureSettings() {
  const stored = await db.settings.get("app");
  if (stored) return stored;
  const timestamp = new Date().toISOString();
  const settings: AppSettings = { id: "app", activeVehicleId: null, themeMode: "dark", efficiencyUnit: "km-per-litre", lastSeenVersion: null, createdAt: timestamp, updatedAt: timestamp };
  await db.settings.put(settings);
  return settings;
}

export async function createVehicle(input: VehicleInput) {
  const timestamp = new Date().toISOString();
  const vehicle: Vehicle = { id: createId("vehicle"), name: input.name.trim(), type: input.type, tankCapacityLitres: input.tankCapacityLitres, currentOdometerKm: input.currentOdometerKm, createdAt: timestamp, updatedAt: timestamp };
  await db.transaction("rw", db.vehicles, db.settings, async () => {
    await db.vehicles.add(vehicle);
    const settings = await ensureSettings();
    if (!settings.activeVehicleId) await db.settings.update("app", { activeVehicleId: vehicle.id, updatedAt: timestamp });
  });
  return vehicle;
}

export async function updateVehicle(id: string, input: VehicleInput) {
  await db.vehicles.update(id, { name: input.name.trim(), type: input.type, tankCapacityLitres: input.tankCapacityLitres, currentOdometerKm: input.currentOdometerKm, updatedAt: new Date().toISOString() });
}

export async function setActiveVehicle(id: string) {
  await db.settings.update("app", { activeVehicleId: id, updatedAt: new Date().toISOString() });
}

export async function createFuelLog(vehicleId: string, input: FuelLogInput) {
  const timestamp = new Date().toISOString();
  const log: FuelLog = { id: createId("fuel"), vehicleId, occurredAt: input.occurredAt, odometerKm: input.odometerKm, litres: input.litres, totalCost: input.totalCost, currencyCode: input.currencyCode, station: input.station, isPartial: input.isPartial, pricePerLitre: null, distanceKm: null, efficiencyKmPerLitre: null, notes: input.notes.trim(), createdAt: timestamp, updatedAt: timestamp };
  const logs = await db.fuelLogs.where("vehicleId").equals(vehicleId).toArray();
  await saveRecalculatedLogs(vehicleId, [...logs, log]);
  return log;
}

export async function updateFuelLog(id: string, input: FuelLogInput) {
  const prior = await db.fuelLogs.get(id);
  if (!prior) throw new Error("Fuel log not found.");
  const updated: FuelLog = { ...prior, ...input, notes: input.notes.trim(), pricePerLitre: null, distanceKm: null, efficiencyKmPerLitre: null, updatedAt: new Date().toISOString() };
  const logs = (await db.fuelLogs.where("vehicleId").equals(prior.vehicleId).toArray()).filter((log) => log.id !== id);
  await saveRecalculatedLogs(prior.vehicleId, [...logs, updated]);
}

export async function deleteFuelLog(id: string) {
  const log = await db.fuelLogs.get(id);
  if (!log) return undefined;
  const snapshot = await readSnapshot();
  const logs = await db.fuelLogs.where("vehicleId").equals(log.vehicleId).toArray();
  await saveRecalculatedLogs(log.vehicleId, logs.filter((item) => item.id !== id));
  return snapshot;
}

async function saveRecalculatedLogs(vehicleId: string, logs: FuelLog[]) {
  const recalculated = recalculateFuelLogs(logs);
  await db.transaction("rw", db.fuelLogs, db.vehicles, async () => {
    await db.fuelLogs.where("vehicleId").equals(vehicleId).delete();
    await db.fuelLogs.bulkPut(recalculated);
    const currentOdometerKm = recalculated.reduce((highest, log) => Math.max(highest, log.odometerKm), 0);
    const vehicle = await db.vehicles.get(vehicleId);
    if (vehicle && currentOdometerKm > vehicle.currentOdometerKm) await db.vehicles.update(vehicleId, { currentOdometerKm, updatedAt: new Date().toISOString() });
  });
}

export async function updateSettings(changes: Partial<Omit<AppSettings, "id" | "createdAt">>) {
  await db.settings.update("app", { ...changes, updatedAt: new Date().toISOString() });
}

export async function readSnapshot(): Promise<AppSnapshot> {
  return { vehicles: await db.vehicles.toArray(), fuelLogs: await db.fuelLogs.toArray(), settings: await db.settings.get("app") };
}

export async function restoreSnapshot(snapshot: AppSnapshot) {
  await db.transaction("rw", db.vehicles, db.fuelLogs, db.settings, async () => {
    await db.vehicles.bulkPut(snapshot.vehicles);
    await db.fuelLogs.bulkPut(snapshot.fuelLogs);
    if (snapshot.settings) await db.settings.put(snapshot.settings);
  });
}

export async function clearAllData() {
  const snapshot = await readSnapshot();
  await db.transaction("rw", db.vehicles, db.fuelLogs, db.settings, async () => {
    await db.vehicles.clear();
    await db.fuelLogs.clear();
    await db.settings.clear();
  });
  return snapshot;
}
