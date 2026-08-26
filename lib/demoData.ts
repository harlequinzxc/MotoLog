import { calculateEconomy } from "@/lib/calculations";
import { createId } from "@/lib/ids";
import type { FillUp, Vehicle } from "@/lib/types";

export interface DemoData {
  vehicle: Vehicle;
  fillUps: FillUp[];
}

const DISTANCES = [
  242, 268, 231, 287, 254, 276, 238, 291, 263, 248, 282, 259,
];
const FUEL_ADDED = [
  5.53, 5.92, 5.27, 6.18, 5.66, 6.04, 5.42, 6.31, 5.88, 5.56, 6.12, 5.71,
];
const FUEL_PRICES = [
  2.78, 2.8, 2.82, 2.79, 2.84, 2.88, 2.85, 2.9, 2.92, 2.89, 2.87, 2.91,
];
const STATIONS = [
  "Shell Bukit Timah",
  "Esso Thomson",
  "SPC Jalan Buroh",
  "Caltex Dunearn",
  "Shell Upper Thomson",
  "Esso Alexandra",
  "SPC Yishun",
  "Caltex Serangoon",
  "Shell Mount Pleasant",
  "Esso Ang Mo Kio",
  "SPC Punggol",
  "Caltex Bukit Batok",
];

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBefore(referenceDate: Date, days: number) {
  const date = new Date(referenceDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function roundToCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Generates one active Yamaha MT-15 and twelve believable historical fill-ups. */
export function generateDemoData(referenceDate = new Date()): DemoData {
  const createdAt = referenceDate.toISOString();
  const vehicleId = createId("vehicle");
  const startingOdometer = 12_480;
  let odometer = startingOdometer;

  const fillUps: FillUp[] = DISTANCES.map((distance, index) => {
    odometer += distance;
    // Demo logs represent normal brim-to-brim fuel stops; partial fills remain
    // available in the log sheet but should not confuse first-time users.
    const isFullTank = true;
    const fuelAdded = FUEL_ADDED[index];
    const fillDate = daysBefore(referenceDate, 342 - index * 28);

    return {
      id: createId("fill"),
      vehicleId,
      date: toDateOnly(fillDate),
      odometer,
      fuelAdded,
      totalCost: roundToCents(fuelAdded * FUEL_PRICES[index]),
      isFullTank,
      station: STATIONS[index],
      notes:
        index === 7
          ? "Evening ride through the city."
          : index === 10
            ? "Weekend highway run."
            : "",
      // The first log is a baseline and intentionally has no calculated trip.
      distance: index === 0 ? null : distance,
      economy:
        index === 0 || !isFullTank ? null : calculateEconomy(distance, fuelAdded),
      createdAt: fillDate.toISOString(),
      updatedAt: fillDate.toISOString(),
    };
  });

  const vehicle: Vehicle = {
    id: vehicleId,
    type: "motorcycle",
    name: "Yamaha MT-15",
    year: 2023,
    tankCapacity: 10,
    reserve: 1.6,
    startingOdometer,
    currentOdometer: odometer,
    unitPreference: null,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  };

  return { vehicle, fillUps };
}
