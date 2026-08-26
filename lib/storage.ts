import {
  DEFAULT_APP_SETTINGS,
  type AppData,
  type AppSettings,
  type FillUp,
  type Vehicle,
} from "@/lib/types";

export const STORAGE_KEYS = {
  vehicles: "motolog:vehicles",
  fillUps: "motolog:fill-ups",
  settings: "motolog:settings",
} as const;

function hasLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVehicle(value: unknown): value is Vehicle {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.tankCapacity === "number" &&
    typeof value.currentOdometer === "number"
  );
}

function isFillUp(value: unknown): value is FillUp {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.vehicleId === "string" &&
    typeof value.date === "string" &&
    typeof value.odometer === "number" &&
    typeof value.fuelAdded === "number"
  );
}

function readValue<T>(key: string, fallback: T): T {
  if (!hasLocalStorage()) {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeValue<T>(key: string, value: T) {
  if (!hasLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota should not break the in-memory app.
  }
}

export function getVehicles(): Vehicle[] {
  const vehicles = readValue<unknown>(STORAGE_KEYS.vehicles, []);
  return Array.isArray(vehicles) ? vehicles.filter(isVehicle) : [];
}

export function setVehicles(vehicles: Vehicle[]) {
  writeValue(STORAGE_KEYS.vehicles, vehicles);
}

export function getFillUps(): FillUp[] {
  const fillUps = readValue<unknown>(STORAGE_KEYS.fillUps, []);
  return Array.isArray(fillUps) ? fillUps.filter(isFillUp) : [];
}

export function setFillUps(fillUps: FillUp[]) {
  writeValue(STORAGE_KEYS.fillUps, fillUps);
}

export function getSettings(): AppSettings {
  const settings = readValue<unknown>(STORAGE_KEYS.settings, null);

  if (!isRecord(settings)) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  return {
    ...DEFAULT_APP_SETTINGS,
    ...settings,
  } as AppSettings;
}

export function setSettings(settings: AppSettings) {
  writeValue(STORAGE_KEYS.settings, settings);
}

export function getAppData(): AppData {
  return {
    vehicles: getVehicles(),
    fillUps: getFillUps(),
    settings: getSettings(),
  };
}

export function setAppData({ vehicles, fillUps, settings }: AppData) {
  setVehicles(vehicles);
  setFillUps(fillUps);
  setSettings(settings);
}

export function clearAppData() {
  if (!hasLocalStorage()) {
    return;
  }

  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Keep the current React state usable even when browser storage is blocked.
  }
}
