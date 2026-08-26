import { toCalendarDate, parseCalendarDate, toCsvDate } from "@/lib/date";
import { createId } from "@/lib/ids";
import {
  fromKilometres,
  fromLitres,
  resolveUnits,
  toKilometres,
  toLitres,
} from "@/lib/units";
import {
  DEFAULT_APP_SETTINGS,
  type AppData,
  type AppSettings,
  type ConsumptionUnit,
  type DistanceUnit,
  type FillUp,
  type Vehicle,
  type VehicleType,
  type VolumeUnit,
} from "@/lib/types";

/**
 * A deliberately human-editable one-sheet format. The settings row establishes
 * how vehicle and fill-up numbers are expressed; import converts all values to
 * MotoLog's internal metric representation.
 */
const SIMPLE_HEADERS = [
  "record_type",
  "vehicle_key",
  "vehicle_name",
  "vehicle_type",
  "year",
  "tank_capacity",
  "reserve",
  "starting_odometer",
  "active",
  "date",
  "odometer",
  "fuel_added",
  "total_cost",
  "full_tank",
  "station",
  "notes",
  "currency",
  "currency_symbol",
  "distance_unit",
  "volume_unit",
  "consumption_unit",
  "accent_theme",
] as const;

const LEGACY_HEADERS = [
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

type Row = Record<string, string>;

function escapeCsv(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function rowToCsv(row: Row, headers: readonly string[]) {
  return headers.map((header) => escapeCsv(row[header] ?? "")).join(",");
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

function tableFromCsv(source: string) {
  const [rawHeaders, ...rawRows] = parseCsv(source);

  if (!rawHeaders) {
    throw new Error("The CSV file is empty.");
  }

  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, "").trim());
  if (!headers.includes("record_type")) {
    throw new Error("This does not look like a MotoLog backup CSV.");
  }

  const rows = rawRows.map<Row>((rawRow) =>
    Object.fromEntries(headers.map((header, index) => [header, rawRow[index] ?? ""])),
  );

  return { headers, rows };
}

function toNumber(value: string, fallback = 0) {
  const raw = value.trim();
  if (!raw) {
    return fallback;
  }

  // Accept spreadsheet values such as "$17.64", "1,234.50", and "17,64".
  const stripped = raw.replace(/[^0-9,.-]/g, "");
  const lastComma = stripped.lastIndexOf(",");
  const lastDot = stripped.lastIndexOf(".");
  const normalized =
    lastComma > lastDot
      ? stripped.replace(/\./g, "").replace(",", ".")
      : stripped.replace(/,/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

function formatNumeric(value: number, decimals?: number) {
  if (!Number.isFinite(value)) {
    return decimals === undefined ? "0" : (0).toFixed(decimals);
  }

  return decimals === undefined
    ? String(Number(value.toFixed(6)))
    : value.toFixed(decimals);
}

function toOptionalNumber(value: string) {
  return value.trim() === "" ? null : toNumber(value, 0);
}

function toBoolean(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  return ["true", "1", "yes", "y"].includes(normalized);
}

/** Accept common spreadsheet-friendly ways of marking a brim-to-brim fill. */
function toFullTank(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  return [
    "true",
    "1",
    "yes",
    "y",
    "full",
    "full fill",
    "full tank",
    "filled",
    "filled to the brim",
    "brim",
    "brimmed",
    "brim-to-brim",
    "✓",
    "x",
  ].includes(normalized);
}

function cleanStationName(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const aliases: Record<string, string> = {
    "esso pasi": "Esso Pasir Ris",
    "esso pasir": "Esso Pasir Ris",
    "esso pasir ris": "Esso Pasir Ris",
  };

  return aliases[normalized.toLocaleLowerCase()] ?? normalized;
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

function isVehicleType(value: string): value is VehicleType {
  return value === "motorcycle" || value === "car";
}

function importSettings(row: Row): AppSettings {
  return {
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

function timestampFromDate(date: string, fallback: string) {
  return (parseCalendarDate(date) ?? new Date(fallback)).toISOString();
}

function simpleSettingsRow(settings: AppSettings): Row {
  return {
    record_type: "settings",
    currency: settings.currency,
    currency_symbol: settings.currencySymbol,
    distance_unit: settings.distanceUnit,
    volume_unit: settings.volumeUnit,
    consumption_unit: settings.consumptionUnit,
    accent_theme: settings.accentTheme,
  };
}

/** Exports one spreadsheet-friendly CSV with no internal IDs or timestamps. */
export function exportAppDataToCsv(data: AppData) {
  const units = resolveUnits(data.settings);
  const keysByVehicleId = new Map(
    data.vehicles.map((vehicle, index) => [vehicle.id, `vehicle-${index + 1}`]),
  );
  const vehicleRows = data.vehicles.map<Row>((vehicle) => ({
    record_type: "vehicle",
    vehicle_key: keysByVehicleId.get(vehicle.id) ?? "vehicle",
    vehicle_name: vehicle.name,
    vehicle_type: vehicle.type,
    year: vehicle.year?.toString() ?? "",
    tank_capacity: formatNumeric(fromLitres(vehicle.tankCapacity, units.volume), 2),
    reserve: formatNumeric(fromLitres(vehicle.reserve, units.volume), 2),
    starting_odometer: formatNumeric(
      fromKilometres(vehicle.startingOdometer, units.distance),
    ),
    active: vehicle.isActive ? "TRUE" : "FALSE",
  }));
  const fillUpRows = data.fillUps
    .filter((fillUp) => keysByVehicleId.has(fillUp.vehicleId))
    .map<Row>((fillUp) => ({
      record_type: "fill_up",
      vehicle_key: keysByVehicleId.get(fillUp.vehicleId) ?? "",
      date: toCsvDate(fillUp.date),
      odometer: formatNumeric(fromKilometres(fillUp.odometer, units.distance)),
      fuel_added: formatNumeric(fromLitres(fillUp.fuelAdded, units.volume), 2),
      total_cost: formatNumeric(fillUp.totalCost, 2),
      full_tank: fillUp.isFullTank ? "TRUE" : "FALSE",
      station: cleanStationName(fillUp.station),
      notes: fillUp.notes,
    }));

  return [
    SIMPLE_HEADERS.join(","),
    ...[simpleSettingsRow(data.settings), ...vehicleRows, ...fillUpRows].map((row) =>
      rowToCsv(row, SIMPLE_HEADERS),
    ),
  ].join("\r\n");
}

function normalizeSimpleFillUpDates(rows: Row[], importedAt: string) {
  const groups = new Map<string, Array<{ index: number; row: Row }>>();

  rows.forEach((row, index) => {
    if (row.record_type !== "fill_up") {
      return;
    }

    const key = row.vehicle_key.trim() || "unassigned";
    const group = groups.get(key) ?? [];
    group.push({ index, row });
    groups.set(key, group);
  });

  groups.forEach((entries) => {
    const validDates = entries
      .map((entry, position) => ({ ...entry, position, date: parseCalendarDate(entry.row.date) }))
      .filter((entry): entry is typeof entry & { date: Date } => entry.date !== null);

    entries.forEach((entry, position) => {
      if (parseCalendarDate(entry.row.date)) {
        entry.row.date = toCalendarDate(entry.row.date, new Date(importedAt));
        return;
      }

      const previous = [...validDates].reverse().find((candidate) => candidate.position < position);
      const next = validDates.find((candidate) => candidate.position > position);
      let inferred: Date;

      if (previous && next) {
        const previousOdometer = toNumber(previous.row.odometer, Number.NaN);
        const currentOdometer = toNumber(entry.row.odometer, Number.NaN);
        const nextOdometer = toNumber(next.row.odometer, Number.NaN);
        const positionalRatio = (position - previous.position) / (next.position - previous.position);
        const odometerRatio =
          Number.isFinite(previousOdometer) &&
          Number.isFinite(currentOdometer) &&
          Number.isFinite(nextOdometer) &&
          nextOdometer > previousOdometer
            ? Math.min(
                Math.max(
                  (currentOdometer - previousOdometer) /
                    (nextOdometer - previousOdometer),
                  0,
                ),
                1,
              )
            : positionalRatio;
        inferred = new Date(
          previous.date.getTime() +
            (next.date.getTime() - previous.date.getTime()) * odometerRatio,
        );
      } else if (previous) {
        inferred = new Date(previous.date.getTime() + (position - previous.position) * 7 * 86_400_000);
      } else if (next) {
        inferred = new Date(next.date.getTime() - (next.position - position) * 7 * 86_400_000);
      } else {
        inferred = new Date(new Date(importedAt).getTime() + position * 7 * 86_400_000);
      }

      entry.row.date = toCalendarDate(inferred.toISOString(), new Date(importedAt));
    });
  });

  return rows;
}

function importSimpleData(rows: Row[]): AppData {
  const importedAt = new Date().toISOString();
  normalizeSimpleFillUpDates(rows, importedAt);
  const settingsRow = rows.find((row) => row.record_type === "settings");
  const settings = settingsRow ? importSettings(settingsRow) : { ...DEFAULT_APP_SETTINGS };
  const units = resolveUnits(settings);
  const vehicles: Vehicle[] = [];
  const vehicleIdsByKey = new Map<string, string>();

  rows.forEach((row, index) => {
    if (row.record_type !== "vehicle" || !isVehicleType(row.vehicle_type)) {
      return;
    }

    const vehicleKey = row.vehicle_key.trim() || `vehicle-${index + 1}`;
    if (vehicleIdsByKey.has(vehicleKey)) {
      throw new Error(`Vehicle key "${vehicleKey}" is duplicated.`);
    }

    const startingOdometer = Math.max(
      toKilometres(toNumber(row.starting_odometer), units.distance),
      0,
    );
    const vehicleId = createId("vehicle");
    vehicleIdsByKey.set(vehicleKey, vehicleId);
    vehicles.push({
      id: vehicleId,
      type: row.vehicle_type,
      name: row.vehicle_name.trim() || "Unnamed vehicle",
      year: toOptionalNumber(row.year),
      tankCapacity: Math.max(toLitres(toNumber(row.tank_capacity), units.volume), 0),
      reserve: Math.max(toLitres(toNumber(row.reserve), units.volume), 0),
      startingOdometer,
      currentOdometer: startingOdometer,
      unitPreference: null,
      isActive: toBoolean(row.active),
      createdAt: importedAt,
      updatedAt: importedAt,
    });
  });

  const fillUps: FillUp[] = rows.flatMap((row) => {
    if (row.record_type !== "fill_up") {
      return [];
    }

    const vehicleId = vehicleIdsByKey.get(row.vehicle_key.trim());
    if (!vehicleId) {
      return [];
    }

    const date = toCalendarDate(row.date, new Date(importedAt));
    const createdAt = timestampFromDate(date, importedAt);
    return [
      {
        id: createId("fill"),
        vehicleId,
        date,
        odometer: Math.max(toKilometres(toNumber(row.odometer), units.distance), 0),
        fuelAdded: Math.max(toLitres(toNumber(row.fuel_added), units.volume), 0),
        totalCost: Math.max(toNumber(row.total_cost), 0),
        isFullTank: toFullTank(row.full_tank),
        station: cleanStationName(row.station),
        notes: row.notes,
        // Recalculated by AppContext after the replacement is applied.
        distance: null,
        economy: null,
        createdAt,
        updatedAt: createdAt,
      },
    ];
  });

  return { vehicles, fillUps, settings };
}

/** Keeps backups made by the previous v0.10 CSV format importable. */
function importLegacyData(rows: Row[]): AppData {
  const importedAt = new Date().toISOString();
  const settingsRow = rows.find((row) => row.record_type === "settings");
  const settings = settingsRow ? importSettings(settingsRow) : { ...DEFAULT_APP_SETTINGS };
  const vehicles: Vehicle[] = rows.flatMap((row) => {
    if (row.record_type !== "vehicle" || !row.id || !isVehicleType(row.vehicle_type)) {
      return [];
    }

    const distance = isDistanceUnit(row.unit_distance)
      ? row.unit_distance
      : undefined;
    const volume = isVolumeUnit(row.unit_volume) ? row.unit_volume : undefined;
    const consumption = isConsumptionUnit(row.unit_consumption)
      ? row.unit_consumption
      : undefined;

    return [
      {
        id: row.id,
        type: row.vehicle_type,
        name: row.name || "Unnamed vehicle",
        year: toOptionalNumber(row.year),
        tankCapacity: Math.max(toNumber(row.tank_capacity_l), 0),
        reserve: Math.max(toNumber(row.reserve_l), 0),
        startingOdometer: Math.max(toNumber(row.starting_odometer_km), 0),
        currentOdometer: Math.max(toNumber(row.current_odometer_km), 0),
        unitPreference:
          distance || volume || consumption
            ? { distance, volume, consumption }
            : null,
        isActive: toBoolean(row.is_active),
        createdAt: row.created_at || importedAt,
        updatedAt: row.updated_at || importedAt,
      },
    ];
  });
  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
  const fillUps: FillUp[] = rows.flatMap((row) => {
    if (row.record_type !== "fill_up" || !row.id || !vehicleIds.has(row.vehicle_id)) {
      return [];
    }

    const date = toCalendarDate(row.date, new Date(importedAt));
    return [
      {
        id: row.id,
        vehicleId: row.vehicle_id,
        date,
        odometer: Math.max(toNumber(row.odometer_km), 0),
        fuelAdded: Math.max(toNumber(row.fuel_added_l), 0),
        totalCost: Math.max(toNumber(row.total_cost), 0),
        isFullTank: toFullTank(row.is_full_tank),
        station: cleanStationName(row.station),
        notes: row.notes,
        distance: toOptionalNumber(row.distance_km),
        economy: toOptionalNumber(row.economy_km_l),
        createdAt: row.created_at || importedAt,
        updatedAt: row.updated_at || importedAt,
      },
    ];
  });

  return { vehicles, fillUps, settings };
}

/** Parses either the new simple template or a legacy MotoLog CSV backup. */
export function importAppDataFromCsv(source: string): AppData {
  const { headers, rows } = tableFromCsv(source);

  if (headers.includes("vehicle_name")) {
    return importSimpleData(rows);
  }

  if (headers.some((header) => LEGACY_HEADERS.includes(header as never))) {
    return importLegacyData(rows);
  }

  throw new Error("This does not look like a MotoLog backup CSV.");
}
