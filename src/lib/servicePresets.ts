import type { MaintenanceItem, VehicleType } from "@/types";
import { addMonthsIso } from "@/lib/date";
import { createId } from "@/lib/id";

interface ServicePreset {
  title: string;
  intervalKm: number | null;
  intervalMonths: number | null;
}

const PRESETS: Record<VehicleType, ServicePreset[]> = {
  motorcycle: [
    { title: "Engine Oil & Filter", intervalKm: 3_000, intervalMonths: 6 },
    { title: "Chain Clean & Lube", intervalKm: 800, intervalMonths: 2 },
    { title: "Sprocket Check", intervalKm: 6_000, intervalMonths: 12 },
    { title: "Brake Fluid", intervalKm: null, intervalMonths: 24 },
    { title: "Fork Oil", intervalKm: 20_000, intervalMonths: 24 }
  ],
  car: [
    { title: "Engine Oil & Filter", intervalKm: 10_000, intervalMonths: 12 },
    { title: "Tire Rotation", intervalKm: 10_000, intervalMonths: 12 },
    { title: "Cabin Air Filter", intervalKm: 15_000, intervalMonths: 12 },
    { title: "Wheel Alignment", intervalKm: 15_000, intervalMonths: 12 },
    { title: "Battery Check", intervalKm: null, intervalMonths: 12 }
  ]
};

export function createServicePresets(
  vehicleId: string,
  vehicleType: VehicleType,
  odometerKm: number,
  now = new Date()
): MaintenanceItem[] {
  const timestamp = now.toISOString();
  return PRESETS[vehicleType].map((preset) => ({
    id: createId("maintenance"),
    vehicleId,
    title: preset.title,
    intervalKm: preset.intervalKm,
    intervalMonths: preset.intervalMonths,
    lastServicedAt: null,
    lastServicedOdometerKm: null,
    dueAt: preset.intervalMonths === null ? null : addMonthsIso(preset.intervalMonths, now),
    dueOdometerKm: preset.intervalKm === null ? null : odometerKm + preset.intervalKm,
    createdAt: timestamp,
    updatedAt: timestamp
  }));
}
