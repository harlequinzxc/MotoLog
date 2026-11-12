import Dexie, { type EntityTable, type Table } from "dexie";

import { STANDARD_SERVICE_ITEMS, serviceItemId } from "@/data/serviceItems";
import { createId } from "@/lib/id";
import { recalculateFuelLogs } from "@/utils/fuelMath";
import type {
  AppSettings,
  AppSnapshot,
  ExpenseInput,
  ExpenseRecord,
  FuelLog,
  FuelLogInput,
  ServiceItem,
  ServiceRecord,
  ServiceVisit,
  ServiceVisitInput,
  ServiceVisitItem,
  Vehicle,
  VehicleInput
} from "@/types";

interface LegacyExpense extends Omit<ExpenseRecord, "category" | "odometerKm" | "createdAt" | "updatedAt"> {
  category: "parking" | "erp" | "other";
}

export class MotoLogDB extends Dexie {
  vehicles!: EntityTable<Vehicle, "id">;
  fuelLogs!: EntityTable<FuelLog, "id">;
  serviceRecords!: EntityTable<ServiceRecord, "id">;
  serviceItems!: EntityTable<ServiceItem, "id">;
  serviceVisits!: EntityTable<ServiceVisit, "id">;
  serviceVisitItems!: EntityTable<ServiceVisitItem, "id">;
  expenseRecords!: EntityTable<ExpenseRecord, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("MotoLogDB");
    this.version(1).stores({
      vehicles: "id,type,createdAt",
      fuelLogs: "id,vehicleId,occurredAt,[vehicleId+occurredAt]",
      serviceRecords: "id,vehicleId,occurredAt",
      expenseRecords: "id,vehicleId,occurredAt",
      settings: "id"
    });
    this.version(2).stores({
      vehicles: "id,type,createdAt",
      fuelLogs: "id,vehicleId,occurredAt,[vehicleId+occurredAt]",
      serviceRecords: "id,vehicleId,occurredAt",
      serviceItems: "id,vehicleId,[vehicleId+title]",
      serviceVisits: "id,vehicleId,occurredAt,[vehicleId+occurredAt]",
      serviceVisitItems: "id,visitId,serviceItemId",
      expenseRecords: "id,vehicleId,occurredAt",
      settings: "id"
    }).upgrade(async (transaction) => {
      const vehicles = await (transaction.table("vehicles") as Table<Vehicle, string>).toArray();
      const legacyServices = await (transaction.table("serviceRecords") as Table<ServiceRecord, string>).toArray();
      const legacyExpenses = await (transaction.table("expenseRecords") as Table<LegacyExpense, string>).toArray();
      const itemsTable = transaction.table("serviceItems") as Table<ServiceItem, string>;
      const visitsTable = transaction.table("serviceVisits") as Table<ServiceVisit, string>;
      const linksTable = transaction.table("serviceVisitItems") as Table<ServiceVisitItem, string>;
      const expensesTable = transaction.table("expenseRecords") as Table<ExpenseRecord, string>;
      const timestamp = new Date().toISOString();

      const standardItems = vehicles.flatMap((vehicle) => STANDARD_SERVICE_ITEMS.map((title) => ({
        id: serviceItemId(vehicle.id, title),
        vehicleId: vehicle.id,
        title,
        isCustom: false,
        createdAt: timestamp,
        updatedAt: timestamp
      })));
      await itemsTable.bulkPut(standardItems);

      for (const record of legacyServices) {
        const standardId = serviceItemId(record.vehicleId, record.title);
        const hasStandard = STANDARD_SERVICE_ITEMS.includes(record.title as typeof STANDARD_SERVICE_ITEMS[number]);
        const itemId = hasStandard ? standardId : `migrated-item_${record.id}`;
        if (!hasStandard) {
          await itemsTable.put({ id: itemId, vehicleId: record.vehicleId, title: record.title, isCustom: true, createdAt: record.occurredAt, updatedAt: timestamp });
        }
        const visitId = `migrated-visit_${record.id}`;
        await visitsTable.put({ id: visitId, vehicleId: record.vehicleId, occurredAt: record.occurredAt, odometerKm: 0, totalCost: record.totalCost, currencyCode: record.currencyCode, notes: record.notes, createdAt: record.occurredAt, updatedAt: timestamp });
        await linksTable.put({ id: `migrated-link_${record.id}`, visitId, serviceItemId: itemId, createdAt: timestamp });
      }

      await Promise.all(legacyExpenses.map((expense) => expensesTable.put({
        ...expense,
        category: expense.category === "erp" ? "tolls-erp" : expense.category,
        odometerKm: null,
        createdAt: expense.occurredAt,
        updatedAt: timestamp
      })));
    });
  }
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

function standardItemsForVehicle(vehicleId: string, timestamp: string): ServiceItem[] {
  return STANDARD_SERVICE_ITEMS.map((title) => ({ id: serviceItemId(vehicleId, title), vehicleId, title, isCustom: false, createdAt: timestamp, updatedAt: timestamp }));
}

export async function createVehicle(input: VehicleInput) {
  const timestamp = new Date().toISOString();
  const vehicle: Vehicle = { id: createId("vehicle"), name: input.name.trim(), type: input.type, fuelType: input.fuelType, tankCapacityLitres: input.tankCapacityLitres, currentOdometerKm: input.currentOdometerKm, distanceUnit: input.distanceUnit, volumeUnit: input.volumeUnit, consumptionUnit: input.consumptionUnit, currencyCode: input.currencyCode, createdAt: timestamp, updatedAt: timestamp };
  await db.transaction("rw", db.vehicles, db.serviceItems, db.settings, async () => {
    await db.vehicles.add(vehicle);
    await db.serviceItems.bulkAdd(standardItemsForVehicle(vehicle.id, timestamp));
    const settings = await ensureSettings();
    if (!settings.activeVehicleId) await db.settings.update("app", { activeVehicleId: vehicle.id, updatedAt: timestamp });
  });
  return vehicle;
}

export async function updateVehicle(id: string, input: VehicleInput) { await db.vehicles.update(id, { ...input, name: input.name.trim(), updatedAt: new Date().toISOString() }); }
export async function setActiveVehicle(id: string) { await db.settings.update("app", { activeVehicleId: id, updatedAt: new Date().toISOString() }); }

export async function createFuelLog(vehicleId: string, input: FuelLogInput) {
  const timestamp = new Date().toISOString();
  const log: FuelLog = { id: createId("fuel"), vehicleId, ...input, stationName: input.stationName.trim(), notes: input.notes.trim(), pricePerLitre: null, distanceKm: null, efficiencyKmPerLitre: null, createdAt: timestamp, updatedAt: timestamp };
  await saveRecalculatedLogs(vehicleId, [...(await db.fuelLogs.where("vehicleId").equals(vehicleId).toArray()), log]);
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

export async function addCustomServiceItem(vehicleId: string, title: string) {
  const timestamp = new Date().toISOString();
  const item: ServiceItem = { id: createId("service-item"), vehicleId, title: title.trim(), isCustom: true, createdAt: timestamp, updatedAt: timestamp };
  await db.serviceItems.add(item);
  return item;
}

export async function createServiceVisit(vehicleId: string, input: ServiceVisitInput) {
  const timestamp = new Date().toISOString();
  const visit: ServiceVisit = { id: createId("service-visit"), vehicleId, occurredAt: input.occurredAt, odometerKm: input.odometerKm, totalCost: input.totalCost, currencyCode: input.currencyCode, notes: input.notes.trim(), createdAt: timestamp, updatedAt: timestamp };
  const links = input.serviceItemIds.map((serviceItemId) => ({ id: createId("service-visit-item"), visitId: visit.id, serviceItemId, createdAt: timestamp }));
  await db.transaction("rw", db.serviceVisits, db.serviceVisitItems, db.vehicles, async () => {
    await db.serviceVisits.add(visit);
    await db.serviceVisitItems.bulkAdd(links);
    const vehicle = await db.vehicles.get(vehicleId);
    if (vehicle && input.odometerKm > vehicle.currentOdometerKm) await db.vehicles.update(vehicleId, { currentOdometerKm: input.odometerKm, updatedAt: timestamp });
  });
  return visit;
}

export async function updateServiceVisit(id: string, input: ServiceVisitInput) {
  const visit = await db.serviceVisits.get(id); if (!visit) throw new Error("Service visit not found.");
  await db.transaction("rw", db.serviceVisits, db.serviceVisitItems, async () => {
    await db.serviceVisits.update(id, { occurredAt: input.occurredAt, odometerKm: input.odometerKm, totalCost: input.totalCost, currencyCode: input.currencyCode, notes: input.notes.trim(), updatedAt: new Date().toISOString() });
    await db.serviceVisitItems.where("visitId").equals(id).delete();
    await db.serviceVisitItems.bulkAdd(input.serviceItemIds.map((serviceItemId) => ({ id: createId("service-visit-item"), visitId: id, serviceItemId, createdAt: new Date().toISOString() })));
  });
}

export async function deleteServiceVisit(id: string) {
  const snapshot = await readSnapshot();
  await db.transaction("rw", db.serviceVisits, db.serviceVisitItems, async () => { await db.serviceVisitItems.where("visitId").equals(id).delete(); await db.serviceVisits.delete(id); });
  return snapshot;
}

export async function createExpense(vehicleId: string, input: ExpenseInput) {
  const timestamp = new Date().toISOString();
  const expense: ExpenseRecord = { id: createId("expense"), vehicleId, ...input, notes: input.notes.trim(), createdAt: timestamp, updatedAt: timestamp };
  await db.expenseRecords.add(expense);
  return expense;
}

export async function updateExpense(id: string, input: ExpenseInput) { await db.expenseRecords.update(id, { ...input, notes: input.notes.trim(), updatedAt: new Date().toISOString() }); }
export async function deleteExpense(id: string) { const snapshot = await readSnapshot(); await db.expenseRecords.delete(id); return snapshot; }
export async function updateSettings(changes: Partial<Omit<AppSettings, "id" | "createdAt">>) { await db.settings.update("app", { ...changes, updatedAt: new Date().toISOString() }); }
export async function readSnapshot(): Promise<AppSnapshot> { return { vehicles: await db.vehicles.toArray(), fuelLogs: await db.fuelLogs.toArray(), serviceRecords: await db.serviceRecords.toArray(), serviceItems: await db.serviceItems.toArray(), serviceVisits: await db.serviceVisits.toArray(), serviceVisitItems: await db.serviceVisitItems.toArray(), expenseRecords: await db.expenseRecords.toArray(), settings: await db.settings.get("app") }; }
export async function restoreSnapshot(snapshot: AppSnapshot) { await db.transaction("rw", db.vehicles, db.fuelLogs, db.serviceRecords, db.serviceItems, db.serviceVisits, db.serviceVisitItems, db.expenseRecords, db.settings, async () => { await db.vehicles.bulkPut(snapshot.vehicles); await db.fuelLogs.bulkPut(snapshot.fuelLogs); await db.serviceRecords.bulkPut(snapshot.serviceRecords); await db.serviceItems.bulkPut(snapshot.serviceItems); await db.serviceVisits.bulkPut(snapshot.serviceVisits); await db.serviceVisitItems.bulkPut(snapshot.serviceVisitItems); await db.expenseRecords.bulkPut(snapshot.expenseRecords); if (snapshot.settings) await db.settings.put(snapshot.settings); }); }
export async function clearAllData() { const snapshot = await readSnapshot(); await db.transaction("rw", db.vehicles, db.fuelLogs, db.serviceRecords, db.serviceItems, db.serviceVisits, db.serviceVisitItems, db.expenseRecords, db.settings, async () => { await db.vehicles.clear(); await db.fuelLogs.clear(); await db.serviceRecords.clear(); await db.serviceItems.clear(); await db.serviceVisits.clear(); await db.serviceVisitItems.clear(); await db.expenseRecords.clear(); await db.settings.clear(); }); return snapshot; }
