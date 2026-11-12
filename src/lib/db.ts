import Dexie, { type EntityTable } from "dexie";

import { createServicePresets } from "@/lib/servicePresets";
import type {
  AppSettings,
  AppSnapshot,
  FixedCost,
  FixedCostInput,
  FuelLog,
  MaintenanceItem,
  ServiceHistory,
  TripLog,
  Vehicle,
  VehicleInput
} from "@/types";
import { createId } from "@/lib/id";

export class MotoLogDB extends Dexie {
  vehicles!: EntityTable<Vehicle, "id">;
  fuelLogs!: EntityTable<FuelLog, "id">;
  tripLogs!: EntityTable<TripLog, "id">;
  maintenanceItems!: EntityTable<MaintenanceItem, "id">;
  serviceHistory!: EntityTable<ServiceHistory, "id">;
  fixedCosts!: EntityTable<FixedCost, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("MotoLogDB");
    this.version(1).stores({
      vehicles: "id, type, createdAt, updatedAt",
      fuelLogs: "id, vehicleId, occurredAt, [vehicleId+occurredAt]",
      tripLogs: "id, vehicleId, occurredAt, [vehicleId+occurredAt]",
      maintenanceItems: "id, vehicleId, dueAt, dueOdometerKm",
      serviceHistory: "id, vehicleId, maintenanceItemId, completedAt",
      fixedCosts: "id, vehicleId, category, renewalAt",
      settings: "id"
    });
  }
}

export const db = new MotoLogDB();

export async function ensureSettings() {
  const existing = await db.settings.get("app");
  if (existing) return existing;

  const now = new Date().toISOString();
  const settings: AppSettings = {
    id: "app",
    activeVehicleId: null,
    themeMode: "dark",
    homeCurrency: "SGD",
    createdAt: now,
    updatedAt: now
  };
  await db.settings.put(settings);
  return settings;
}

export async function createVehicleWithPresets(input: VehicleInput) {
  const now = new Date();
  const vehicle: Vehicle = {
    id: createId("vehicle"),
    name: input.name.trim(),
    type: input.type,
    makeModel: input.makeModel.trim(),
    plateNumber: input.plateNumber.trim().toUpperCase(),
    year: input.year,
    defaultFuelGrade: input.defaultFuelGrade.trim(),
    tankCapacityLitres: input.tankCapacityLitres,
    currentOdometerKm: input.currentOdometerKm,
    homeCurrency: "SGD",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  const presets = createServicePresets(
    vehicle.id,
    vehicle.type,
    vehicle.currentOdometerKm,
    now
  );

  await db.transaction("rw", db.vehicles, db.maintenanceItems, db.settings, async () => {
    await db.vehicles.add(vehicle);
    await db.maintenanceItems.bulkAdd(presets);
    const settings = await ensureSettings();
    if (settings.activeVehicleId === null) {
      await db.settings.update("app", {
        activeVehicleId: vehicle.id,
        updatedAt: new Date().toISOString()
      });
    }
  });

  return vehicle;
}

export async function updateVehicle(id: string, input: VehicleInput) {
  await db.vehicles.update(id, {
    name: input.name.trim(),
    type: input.type,
    makeModel: input.makeModel.trim(),
    plateNumber: input.plateNumber.trim().toUpperCase(),
    year: input.year,
    defaultFuelGrade: input.defaultFuelGrade.trim(),
    tankCapacityLitres: input.tankCapacityLitres,
    currentOdometerKm: input.currentOdometerKm,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteVehicleWithRelations(vehicleId: string) {
  const snapshot = await snapshotVehicle(vehicleId);
  await db.transaction(
    "rw",
    db.vehicles,
    db.fuelLogs,
    db.tripLogs,
    db.maintenanceItems,
    db.serviceHistory,
    db.fixedCosts,
    db.settings,
    async () => {
      await Promise.all([
        db.fuelLogs.where("vehicleId").equals(vehicleId).delete(),
        db.tripLogs.where("vehicleId").equals(vehicleId).delete(),
        db.maintenanceItems.where("vehicleId").equals(vehicleId).delete(),
        db.serviceHistory.where("vehicleId").equals(vehicleId).delete(),
        db.fixedCosts.where("vehicleId").equals(vehicleId).delete()
      ]);
      await db.vehicles.delete(vehicleId);
      const settings = await ensureSettings();
      if (settings.activeVehicleId === vehicleId) {
        const fallback = await db.vehicles.orderBy("createdAt").first();
        await db.settings.update("app", {
          activeVehicleId: fallback?.id ?? null,
          updatedAt: new Date().toISOString()
        });
      }
    }
  );
  return snapshot;
}

export async function restoreVehicleSnapshot(snapshot: AppSnapshot) {
  await db.transaction(
    "rw",
    db.vehicles,
    db.fuelLogs,
    db.tripLogs,
    db.maintenanceItems,
    db.serviceHistory,
    db.fixedCosts,
    db.settings,
    async () => {
      await db.vehicles.bulkPut(snapshot.vehicles);
      await db.fuelLogs.bulkPut(snapshot.fuelLogs);
      await db.tripLogs.bulkPut(snapshot.tripLogs);
      await db.maintenanceItems.bulkPut(snapshot.maintenanceItems);
      await db.serviceHistory.bulkPut(snapshot.serviceHistory);
      await db.fixedCosts.bulkPut(snapshot.fixedCosts);
      if (snapshot.settings) await db.settings.put(snapshot.settings);
    }
  );
}

async function snapshotVehicle(vehicleId: string): Promise<AppSnapshot> {
  const vehicle = await db.vehicles.get(vehicleId);
  const settings = await db.settings.get("app");
  return {
    vehicles: vehicle ? [vehicle] : [],
    fuelLogs: await db.fuelLogs.where("vehicleId").equals(vehicleId).toArray(),
    tripLogs: await db.tripLogs.where("vehicleId").equals(vehicleId).toArray(),
    maintenanceItems: await db.maintenanceItems.where("vehicleId").equals(vehicleId).toArray(),
    serviceHistory: await db.serviceHistory.where("vehicleId").equals(vehicleId).toArray(),
    fixedCosts: await db.fixedCosts.where("vehicleId").equals(vehicleId).toArray(),
    settings
  };
}

export async function addFixedCost(vehicleId: string, input: FixedCostInput) {
  const now = new Date().toISOString();
  const cost: FixedCost = {
    id: createId("fixed-cost"),
    vehicleId,
    category: input.category,
    label: input.label.trim(),
    amount: input.amount,
    currencyCode: "SGD",
    billingCycle: input.billingCycle,
    renewalAt: input.renewalAt,
    createdAt: now,
    updatedAt: now
  };
  await db.fixedCosts.add(cost);
  return cost;
}

export async function updateTheme(themeMode: AppSettings["themeMode"]) {
  await db.settings.update("app", { themeMode, updatedAt: new Date().toISOString() });
}

export async function setActiveVehicleId(activeVehicleId: string) {
  await db.settings.update("app", {
    activeVehicleId,
    updatedAt: new Date().toISOString()
  });
}
