import { db, ensureSettings } from "@/lib/db";
import { createId } from "@/lib/id";
import { recalculateFuelLogs } from "@/utils/fuelMath";
import type { FuelLog, Vehicle } from "@/types";

function sampleTimestamp(year: number, month: number, day: number) {
  return new Date(year, month, day, 12).toISOString();
}

function vehicle(id: string, name: string, type: Vehicle["type"], tankCapacityLitres: number, currentOdometerKm: number, createdAt: string): Vehicle {
  return { id, name, type, tankCapacityLitres, currentOdometerKm, createdAt, updatedAt: createdAt };
}

function log(vehicleId: string, date: string, odometerKm: number, litres: number, totalCost: number, currencyCode: FuelLog["currencyCode"], station: string, isPartial: boolean, notes: string): FuelLog {
  const occurredAt = new Date(`${date}T12:00:00`).toISOString();
  return { id: createId("fuel"), vehicleId, occurredAt, odometerKm, litres, totalCost, currencyCode, station, isPartial, pricePerLitre: null, distanceKm: null, efficiencyKmPerLitre: null, notes, createdAt: occurredAt, updatedAt: occurredAt };
}

export async function seedSampleData() {
  if (await db.vehicles.count()) return;
  const createdAt = sampleTimestamp(2026, 5, 1);
  const mt15Id = createId("vehicle");
  const civicId = createId("vehicle");
  const mt15 = vehicle(mt15Id, "Yamaha MT-15", "motorcycle", 10, 18_534, createdAt);
  const civic = vehicle(civicId, "Honda Civic FD4", "car", 50, 104_920, createdAt);
  const sampleLogs = [
    log(mt15Id, "2026-06-04", 17_240, 8.9, 32.06, "SGD", "Shell", false, "Baseline fill."),
    log(mt15Id, "2026-06-18", 17_510, 4.1, 14.84, "SGD", "Esso", true, "Quick top-up before an evening ride."),
    log(mt15Id, "2026-06-30", 17_706, 5.7, 20.52, "SGD", "SPC", false, "Full fill after partial top-up."),
    log(mt15Id, "2026-07-13", 17_966, 8.7, 31.49, "SGD", "Caltex", false, "Weekend city ride."),
    log(mt15Id, "2026-07-28", 18_230, 8.5, 30.77, "SGD", "Sinopec", false, "Regular commute refill."),
    log(mt15Id, "2026-08-15", 18_534, 9.0, 32.58, "SGD", "Shell", false, "Morning pump stop."),
    log(civicId, "2026-06-03", 103_440, 41.2, 148.32, "SGD", "Shell", false, "Baseline fill."),
    log(civicId, "2026-06-22", 103_882, 44.5, 160.20, "SGD", "Esso", false, "Business visit day."),
    log(civicId, "2026-07-05", 104_298, 39.6, 81.18, "MYR", "Petronas", false, "Johor weekend trip."),
    log(civicId, "2026-07-19", 104_570, 16.0, 57.76, "SGD", "SPC", true, "Short local top-up."),
    log(civicId, "2026-08-03", 104_810, 34.9, 74.74, "MYR", "Petronas", false, "Malaysia full fill after partial."),
    log(civicId, "2026-08-22", 104_920, 11.3, 40.78, "SGD", "Caltex", true, "Pre-weekend top-up.")
  ];

  await db.transaction("rw", db.vehicles, db.fuelLogs, db.settings, async () => {
    await db.vehicles.bulkAdd([mt15, civic]);
    const recalculated = [
      ...recalculateFuelLogs(sampleLogs.filter((item) => item.vehicleId === mt15Id)),
      ...recalculateFuelLogs(sampleLogs.filter((item) => item.vehicleId === civicId))
    ];
    await db.fuelLogs.bulkAdd(recalculated);
    const settings = await ensureSettings();
    await db.settings.update(settings.id, { activeVehicleId: mt15Id, updatedAt: new Date().toISOString() });
  });
}
