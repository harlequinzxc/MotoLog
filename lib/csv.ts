import {
  DEFAULT_APP_SETTINGS,
  type AppData,
  type AppSettings,
  type ConsumptionUnit,
  type DistanceUnit,
  type FillUp,
  type UnitPreference,
  type Vehicle,
  type VehicleType,
  type VolumeUnit,
} from "@/lib/types";

const HEADERS = [
  "record_type",
  "id",
  "vehicle_id",
  "vehicle_type",
  "name",
  "year",
  "tank_capacity_l",
  "reserve_l",
  "starting_odometer_km",
  "current_odometer_km",
  "unit_distance",
  "unit_volume",
  "unit_consumption",
  "is_active",
  "date",
  "odometer_km",
  "fuel_added_l",
  "total_cost",
  "is_full_tank",
  "station",
  "notes",
  "distance_km",
  "economy_km_l",
  "created_at",
  "updated_at",
  "currency",
  "currency_symbol",
  "distance_unit",
  "volume_unit",
  "consumption_unit",
  "accent_theme",
] as const;

type Header = (typeof HEADERS)[number];
type CsvRow = Record<Header, string>;

function blankRow(recordType: string): CsvRow {
  return {
    record_type: recordType,
    id: "",
    vehicle_id: "",
    vehicle_type: "",
    name: "",
    year: "",
    tank_capacity_l: "",
    reserve_l: "",
    starting_odometer_km: "",
    current_odometer_km: "",
    unit_distance: "",
    unit_volume: "",
    unit_consumption: "",
    is_active: "",
    date: "",
    odometer_km: "",
    fuel_added_l: "",
    total_cost: "",
    is_full_tank: "",
    station: "",
    notes: "",
    distance_km: "",
    economy_km_l: "",
    created_at: "",
    updated_at: "",
    currency: "",
    currency_symbol: "",
    distance_unit: "",
    volume_unit: "",
    consumption_unit: "",
    accent_theme: "",
  };
}

function escapeCsv(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function rowToCsv(row: CsvRow) {
  return HEADERS.map((header) => escapeCsv(row[header])).join(",");
}

function vehicleRow(vehicle: Vehicle): CsvRow {
  const row = blankRow("vehicle");
  row.id = vehicle.id;
  row.vehicle_type = vehicle.type;
  row.name = vehicle.name;
  row.year = vehicle.year?.toString() ?? "";
  row.tank_capacity_l = vehicle.tankCapacity.toString();
  row.reserve_l = vehicle.reserve.toString();
  row.starting_odometer_km = vehicle.startingOdometer.toString();
  row.current_odometer_km = vehicle.currentOdometer.toString();
  row.unit_distance = vehicle.unitPreference?.distance ?? "";
  row.unit_volume = vehicle.unitPreference?.volume ?? "";
  row.unit_consumption = vehicle.unitPreference?.consumption ?? "";
  row.is_active = String(vehicle.isActive);
  row.created_at = vehicle.createdAt;
  row.updated_at = vehicle.updatedAt;
  return row;
}

function fillUpRow(fillUp: FillUp): CsvRow {
  const row = blankRow("fill_up");
  row.id = fillUp.id;
  row.vehicle_id = fillUp.vehicleId;
  row.date = fillUp.date;
  row.odometer_km = fillUp.odometer.toString();
  row.fuel_added_l = fillUp.fuelAdded.toString();
  row.total_cost = fillUp.totalCost.toString();
  row.is_full_tank = String(fillUp.isFullTank);
  row.station = fillUp.station;
  row.notes = fillUp.notes;
  row.distance_km = fillUp.distance?.toString() ?? "";
  row.economy_km_l = fillUp.economy?.toString() ?? "";
  row.created_at = fillUp.createdAt;
  row.updated_at = fillUp.updatedAt;
  return row;
}

function settingsRow(settings: AppSettings): CsvRow {
  const row = blankRow("settings");
  row.currency = settings.currency;
  row.currency_symbol = settings.currencySymbol;
  row.distance_unit = settings.distanceUnit;
  row.volume_unit = settings.volumeUnit;
  row.consumption_unit = settings.consumptionUnit;
  row.accent_theme = settings.accentTheme;
  return row;
}

/** Exports a single, spreadsheet-friendly CSV with settings, vehicles, and logs. */
export function exportAppDataToCsv(data: AppData) {
  const rows = [
    settingsRow(data.settings),
    ...data.vehicles.map(vehicleRow),
    ...data.fillUps.map(fillUpRow),
  ];

  return [HEADERS.join(","), ...rows.map(rowToCsv)].join("\r\n");
}

function parseCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (character === '"') {
      if (inQuotes && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  if (inQuotes) {
    throw new Error("The CSV contains an unclosed quoted value.");
  }

  return rows;
}

function toNumber(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toOptionalNumber(value: string) {
  return value.trim() === "" ? null : toNumber(value, 0);
}

function toBoolean(value: string) {
  return value.toLocaleLowerCase() === "true" || value === "1";
}

function isDistanceUnit(value: string): value is DistanceUnit {
  return value === "km" || value === "mi";
}

function isVolumeUnit(value: string): value is VolumeUnit {
  return value === "L" || value === "gal-us" || value === "gal-uk";
}

function isConsumptionUnit(value: string): value is ConsumptionUnit {
  return ["km/L", "L/100km", "mpg-us", "mpg-uk"].includes(value);
}

function vehicleUnitPreference(row: CsvRow): Partial<UnitPreference> | null {
  const preference: Partial<UnitPreference> = {};

  if (isDistanceUnit(row.unit_distance)) {
    preference.distance = row.unit_distance;
  }
  if (isVolumeUnit(row.unit_volume)) {
    preference.volume = row.unit_volume;
  }
  if (isConsumptionUnit(row.unit_consumption)) {
    preference.consumption = row.unit_consumption;
  }

  return Object.keys(preference).length > 0 ? preference : null;
}

function isVehicleType(value: string): value is VehicleType {
  return value === "motorcycle" || value === "car";
}

function dataRows(source: string): CsvRow[] {
  const parsedRows = parseCsv(source);
  const [rawHeaders, ...rawRows] = parsedRows;

  if (!rawHeaders) {
    throw new Error("The CSV file is empty.");
  }

  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, "").trim());
  if (!headers.includes("record_type")) {
    throw new Error("This does not look like a MotoLog backup CSV.");
  }

  return rawRows.map((rawRow) => {
    const row = blankRow("");
    headers.forEach((header, index) => {
      if (HEADERS.includes(header as Header)) {
        row[header as Header] = rawRow[index] ?? "";
      }
    });
    return row;
  });
}

/** Parses a MotoLog CSV backup into a replacement-ready application snapshot. */
export function importAppDataFromCsv(source: string): AppData {
  const rows = dataRows(source);
  const importedAt = new Date().toISOString();
  let settings: AppSettings = { ...DEFAULT_APP_SETTINGS };
  const vehicles: Vehicle[] = [];
  const fillUps: FillUp[] = [];

  rows.forEach((row) => {
    if (row.record_type === "settings") {
      settings = {
        currency: row.currency || DEFAULT_APP_SETTINGS.currency,
        currencySymbol: row.currency_symbol || DEFAULT_APP_SETTINGS.currencySymbol,
        distanceUnit: isDistanceUnit(row.distance_unit)
          ? row.distance_unit
          : DEFAULT_APP_SETTINGS.distanceUnit,
        volumeUnit: isVolumeUnit(row.volume_unit)
          ? row.volume_unit
          : DEFAULT_APP_SETTINGS.volumeUnit,
        consumptionUnit: isConsumptionUnit(row.consumption_unit)
          ? row.consumption_unit
          : DEFAULT_APP_SETTINGS.consumptionUnit,
        accentTheme: row.accent_theme || DEFAULT_APP_SETTINGS.accentTheme,
      };
    }

    if (row.record_type === "vehicle" && row.id && isVehicleType(row.vehicle_type)) {
      vehicles.push({
        id: row.id,
        type: row.vehicle_type,
        name: row.name || "Unnamed vehicle",
        year: toOptionalNumber(row.year),
        tankCapacity: Math.max(toNumber(row.tank_capacity_l), 0),
        reserve: Math.max(toNumber(row.reserve_l), 0),
        startingOdometer: Math.max(toNumber(row.starting_odometer_km), 0),
        currentOdometer: Math.max(toNumber(row.current_odometer_km), 0),
        unitPreference: vehicleUnitPreference(row),
        isActive: toBoolean(row.is_active),
        createdAt: row.created_at || importedAt,
        updatedAt: row.updated_at || importedAt,
      });
    }
  });

  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
  rows.forEach((row) => {
    if (row.record_type !== "fill_up" || !row.id || !vehicleIds.has(row.vehicle_id)) {
      return;
    }

    fillUps.push({
      id: row.id,
      vehicleId: row.vehicle_id,
      date: row.date || importedAt.slice(0, 10),
      odometer: Math.max(toNumber(row.odometer_km), 0),
      fuelAdded: Math.max(toNumber(row.fuel_added_l), 0),
      totalCost: Math.max(toNumber(row.total_cost), 0),
      isFullTank: toBoolean(row.is_full_tank),
      station: row.station,
      notes: row.notes,
      distance: toOptionalNumber(row.distance_km),
      economy: toOptionalNumber(row.economy_km_l),
      createdAt: row.created_at || importedAt,
      updatedAt: row.updated_at || importedAt,
    });
  });

  return { vehicles, fillUps, settings };
}
