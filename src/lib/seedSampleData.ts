import { db, ensureSettings } from "@/lib/db";
import { createServicePresets } from "@/lib/servicePresets";
import { createId } from "@/lib/id";
import type {
  FixedCost,
  FuelLog,
  ServiceHistory,
  TripLog,
  Vehicle
} from "@/types";

function isoDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12, 0, 0).toISOString();
}

function sampleVehicle(input: Omit<Vehicle, "id" | "createdAt" | "updatedAt">, id: string, timestamp: string): Vehicle {
  return { ...input, id, createdAt: timestamp, updatedAt: timestamp };
}

function fuelLog(
  vehicleId: string,
  date: string,
  odometerKm: number,
  fuelVolumeLitres: number,
  totalCost: number,
  currencyCode: "SGD" | "MYR",
  stationName: string,
  isFullTank: boolean,
  notes: string
): FuelLog {
  const timestamp = new Date(`${date}T12:00:00`).toISOString();
  return {
    id: createId("fuel"),
    vehicleId,
    occurredAt: timestamp,
    odometerKm,
    fuelVolumeLitres,
    totalCost,
    currencyCode,
    stationName,
    fuelGrade: "RON 95",
    isFullTank,
    notes,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function seedSampleData() {
  const existingVehicles = await db.vehicles.count();
  if (existingVehicles > 0) return;

  const now = new Date("2026-08-26T12:00:00");
  const timestamp = now.toISOString();
  const mt15Id = createId("vehicle");
  const civicId = createId("vehicle");
  const mt15 = sampleVehicle(
    {
      name: "Night Runner",
      type: "motorcycle",
      makeModel: "Yamaha MT-15",
      plateNumber: "FZP 1515",
      year: 2024,
      defaultFuelGrade: "RON 95",
      tankCapacityLitres: 10,
      currentOdometerKm: 15_438,
      homeCurrency: "SGD"
    },
    mt15Id,
    timestamp
  );
  const civic = sampleVehicle(
    {
      name: "Daily Civic",
      type: "car",
      makeModel: "Honda Civic FD4",
      plateNumber: "SLE 8404 K",
      year: 2010,
      defaultFuelGrade: "RON 95",
      tankCapacityLitres: 50,
      currentOdometerKm: 98_420,
      homeCurrency: "SGD"
    },
    civicId,
    timestamp
  );

  const fuelLogs: FuelLog[] = [
    fuelLog(mt15Id, "2026-06-04", 14_198, 8.9, 32.06, "SGD", "Shell Bukit Timah", true, "Morning commute refill."),
    fuelLog(mt15Id, "2026-06-18", 14_460, 4.1, 14.84, "SGD", "Esso Upper Thomson", false, "Top-up before an evening ride."),
    fuelLog(mt15Id, "2026-06-30", 14_662, 5.7, 20.52, "SGD", "SPC Jalan Buroh", true, "Filled to brim after the partial top-up."),
    fuelLog(mt15Id, "2026-07-12", 14_911, 8.6, 31.13, "SGD", "Shell Toa Payoh", true, "Weekend city run."),
    fuelLog(mt15Id, "2026-07-26", 15_182, 8.8, 31.77, "SGD", "Esso Pasir Ris", true, "Evening ride through the city."),
    fuelLog(mt15Id, "2026-08-09", 15_438, 8.5, 30.77, "SGD", "SPC Sembawang", true, "Regular commute fill."),
    fuelLog(civicId, "2026-06-03", 97_540, 41.2, 148.32, "SGD", "Shell Ang Mo Kio", true, "Monthly family errands."),
    fuelLog(civicId, "2026-06-21", 97_992, 44.5, 160.20, "SGD", "Esso Jalan Buroh", true, "Business client visits."),
    fuelLog(civicId, "2026-07-05", 98_421, 39.6, 81.18, "MYR", "Petronas Johor Bahru", true, "Cross-border weekend trip."),
    fuelLog(civicId, "2026-07-18", 98_735, 16.0, 57.76, "SGD", "SPC Punggol", false, "Quick Singapore top-up."),
    fuelLog(civicId, "2026-08-02", 99_116, 34.9, 74.74, "MYR", "Shell MY Skudai", true, "Malaysia refill after partial top-up."),
    fuelLog(civicId, "2026-08-22", 99_420, 40.5, 146.07, "SGD", "Shell Clementi", true, "Pre-service full tank." )
  ];

  const tripLogs: TripLog[] = [
    {
      id: createId("trip"), vehicleId: mt15Id, occurredAt: isoDate(2026, 5, 15), purpose: "personal", distanceKm: 68,
      erpCost: 0, parkingCost: 2.4, currencyCode: "SGD", notes: "East Coast sunset ride.", createdAt: timestamp, updatedAt: timestamp
    },
    {
      id: createId("trip"), vehicleId: civicId, occurredAt: isoDate(2026, 6, 8), purpose: "business", distanceKm: 154,
      erpCost: 6.5, parkingCost: 12, currencyCode: "SGD", notes: "Client site visits across the island.", createdAt: timestamp, updatedAt: timestamp
    },
    {
      id: createId("trip"), vehicleId: civicId, occurredAt: isoDate(2026, 7, 1), purpose: "personal", distanceKm: 284,
      erpCost: 0, parkingCost: 8, currencyCode: "MYR", notes: "Johor weekend grocery run.", createdAt: timestamp, updatedAt: timestamp
    }
  ];

  const fixedCosts: FixedCost[] = [
    { id: createId("cost"), vehicleId: mt15Id, category: "road-tax", label: "Road Tax", amount: 68, currencyCode: "SGD", billingCycle: "annual", renewalAt: isoDate(2026, 10, 12), createdAt: timestamp, updatedAt: timestamp },
    { id: createId("cost"), vehicleId: mt15Id, category: "insurance", label: "Motor Insurance", amount: 492, currencyCode: "SGD", billingCycle: "annual", renewalAt: isoDate(2026, 11, 3), createdAt: timestamp, updatedAt: timestamp },
    { id: createId("cost"), vehicleId: civicId, category: "road-tax", label: "Road Tax", amount: 742, currencyCode: "SGD", billingCycle: "annual", renewalAt: isoDate(2026, 9, 18), createdAt: timestamp, updatedAt: timestamp },
    { id: createId("cost"), vehicleId: civicId, category: "insurance", label: "Motor Insurance", amount: 1280, currencyCode: "SGD", billingCycle: "annual", renewalAt: isoDate(2026, 12, 7), createdAt: timestamp, updatedAt: timestamp },
    { id: createId("cost"), vehicleId: civicId, category: "season-parking", label: "Season Parking", amount: 110, currencyCode: "SGD", billingCycle: "monthly", renewalAt: isoDate(2026, 8, 31), createdAt: timestamp, updatedAt: timestamp }
  ];

  const serviceHistory: ServiceHistory[] = [
    {
      id: createId("service"), vehicleId: mt15Id, maintenanceItemId: null, completedAt: isoDate(2026, 5, 28),
      odometerKm: 14_100, totalCost: 58, currencyCode: "SGD", notes: "Engine oil and chain service.", createdAt: timestamp
    },
    {
      id: createId("service"), vehicleId: civicId, maintenanceItemId: null, completedAt: isoDate(2026, 5, 20),
      odometerKm: 97_340, totalCost: 168, currencyCode: "SGD", notes: "Oil, filter, and tire rotation.", createdAt: timestamp
    }
  ];

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
      await db.vehicles.bulkAdd([mt15, civic]);
      await db.fuelLogs.bulkAdd(fuelLogs);
      await db.tripLogs.bulkAdd(tripLogs);
      await db.maintenanceItems.bulkAdd([
        ...createServicePresets(mt15Id, "motorcycle", mt15.currentOdometerKm, now),
        ...createServicePresets(civicId, "car", civic.currentOdometerKm, now)
      ]);
      await db.serviceHistory.bulkAdd(serviceHistory);
      await db.fixedCosts.bulkAdd(fixedCosts);
      const settings = await ensureSettings();
      await db.settings.update(settings.id, {
        activeVehicleId: mt15Id,
        updatedAt: new Date().toISOString()
      });
    }
  );
}
