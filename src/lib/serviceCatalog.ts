import type { Table, Transaction } from "dexie";

import { serviceItemId, serviceItemsForVehicleType, servicePresetForKey, servicePresetForLegacyTitle, type ServiceItemPreset } from "@/data/serviceItems";
import type { ServiceItem, ServiceVisitItem, Vehicle } from "@/types";

function presetFields(preset: ServiceItemPreset, timestamp: string) {
  return {
    title: preset.title,
    presetKey: preset.key,
    cadence: preset.cadence,
    schedule: preset.schedule,
    guidance: preset.guidance,
    isArchived: false,
    updatedAt: timestamp
  };
}

export function standardServiceItemsForVehicle(vehicle: Vehicle, timestamp: string): ServiceItem[] {
  return serviceItemsForVehicleType(vehicle.type).map((preset) => ({
    id: serviceItemId(vehicle.id, preset.key),
    vehicleId: vehicle.id,
    isCustom: false,
    createdAt: timestamp,
    ...presetFields(preset, timestamp)
  }));
}

export function legacyStandardServiceItem(vehicleId: string, title: string, timestamp: string): ServiceItem {
  return {
    id: serviceItemId(vehicleId, title),
    vehicleId,
    title,
    isCustom: false,
    presetKey: null,
    cadence: null,
    schedule: null,
    guidance: null,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function customServiceItem(vehicleId: string, id: string, title: string, timestamp: string): ServiceItem {
  return {
    id,
    vehicleId,
    title: title.trim(),
    isCustom: true,
    presetKey: null,
    cadence: null,
    schedule: null,
    guidance: null,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function reconcileServiceCatalogForVehicle({ itemTable, items, linkedItemIds, timestamp, vehicle }: {
  itemTable: Table<ServiceItem, string>;
  items: ServiceItem[];
  linkedItemIds: Set<string>;
  timestamp: string;
  vehicle: Vehicle;
}) {
  const usedPresetKeys = new Set<string>();

  for (const item of items) {
    if (item.isCustom) {
      await itemTable.update(item.id, { presetKey: null, cadence: null, schedule: null, guidance: null, isArchived: false, updatedAt: timestamp });
      continue;
    }

    const preset = item.presetKey ? servicePresetForKey(vehicle.type, item.presetKey) : servicePresetForLegacyTitle(vehicle.type, item.title);
    if (preset && !usedPresetKeys.has(preset.key)) {
      await itemTable.update(item.id, presetFields(preset, timestamp));
      usedPresetKeys.add(preset.key);
      continue;
    }

    if (linkedItemIds.has(item.id)) {
      await itemTable.update(item.id, { presetKey: null, cadence: null, schedule: null, guidance: null, isArchived: true, updatedAt: timestamp });
    } else {
      await itemTable.delete(item.id);
    }
  }

  const missingItems = standardServiceItemsForVehicle(vehicle, timestamp).filter((item) => !usedPresetKeys.has(item.presetKey ?? ""));
  if (missingItems.length > 0) await itemTable.bulkPut(missingItems);
}

export async function migrateServiceCatalog(transaction: Transaction) {
  const vehicles = await (transaction.table("vehicles") as Table<Vehicle, string>).toArray();
  const itemTable = transaction.table("serviceItems") as Table<ServiceItem, string>;
  const serviceVisitItems = await (transaction.table("serviceVisitItems") as Table<ServiceVisitItem, string>).toArray();
  const items = await itemTable.toArray();
  const linkedItemIds = new Set(serviceVisitItems.map((item) => item.serviceItemId));
  const timestamp = new Date().toISOString();

  for (const vehicle of vehicles) {
    await reconcileServiceCatalogForVehicle({
      itemTable,
      items: items.filter((item) => item.vehicleId === vehicle.id),
      linkedItemIds,
      timestamp,
      vehicle
    });
  }
}
