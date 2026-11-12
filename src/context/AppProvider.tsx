import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { clearAllData, createFuelLog, createVehicle, db, deleteFuelLog, ensureSettings, readSnapshot, restoreSnapshot, setActiveVehicle, updateFuelLog, updateSettings, updateVehicle } from "@/lib/db";
import { seedSampleData } from "@/lib/seedSampleData";
import type { AppSettings, AppSnapshot, FuelLog, FuelLogInput, Vehicle, VehicleInput } from "@/types";

interface AppContextValue {
  activeVehicle: Vehicle | null;
  addFuelLog: (input: FuelLogInput) => Promise<void>;
  clearAllData: () => Promise<AppSnapshot>;
  createVehicle: (input: VehicleInput) => Promise<void>;
  deleteFuelLog: (id: string) => Promise<AppSnapshot | undefined>;
  error: string | null;
  fuelLogs: FuelLog[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  restoreSnapshot: (snapshot: AppSnapshot) => Promise<void>;
  seedSampleData: () => Promise<void>;
  setActiveVehicle: (id: string) => Promise<void>;
  settings: AppSettings | null;
  updateFuelLog: (id: string, input: FuelLogInput) => Promise<void>;
  updateSettings: (changes: Partial<Omit<AppSettings, "id" | "createdAt">>) => Promise<void>;
  updateVehicle: (id: string, input: VehicleInput) => Promise<void>;
  vehicles: Vehicle[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
function applyTheme(theme: AppSettings["themeMode"]) { document.documentElement.classList.toggle("dark", theme === "dark"); }

export function AppProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextSettings = await ensureSettings();
      const [nextVehicles, nextLogs] = await Promise.all([db.vehicles.orderBy("createdAt").toArray(), db.fuelLogs.orderBy("occurredAt").reverse().toArray()]);
      setSettings(nextSettings); setVehicles(nextVehicles); setFuelLogs(nextLogs); setError(null); applyTheme(nextSettings.themeMode);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Unable to read local MotoLog data."); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const activeVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === settings?.activeVehicleId) ?? vehicles[0] ?? null, [settings?.activeVehicleId, vehicles]);
  const addVehicle = useCallback(async (input: VehicleInput) => { await createVehicle(input); await refresh(); }, [refresh]);
  const saveVehicle = useCallback(async (id: string, input: VehicleInput) => { await updateVehicle(id, input); await refresh(); }, [refresh]);
  const activate = useCallback(async (id: string) => { await setActiveVehicle(id); await refresh(); }, [refresh]);
  const addLog = useCallback(async (input: FuelLogInput) => { if (!activeVehicle) throw new Error("Add a vehicle before logging fuel."); await createFuelLog(activeVehicle.id, input); await refresh(); }, [activeVehicle, refresh]);
  const saveLog = useCallback(async (id: string, input: FuelLogInput) => { await updateFuelLog(id, input); await refresh(); }, [refresh]);
  const removeLog = useCallback(async (id: string) => { const snapshot = await deleteFuelLog(id); await refresh(); return snapshot; }, [refresh]);
  const saveSettings = useCallback(async (changes: Partial<Omit<AppSettings, "id" | "createdAt">>) => { await updateSettings(changes); await refresh(); }, [refresh]);
  const seed = useCallback(async () => { await seedSampleData(); await refresh(); }, [refresh]);
  const clear = useCallback(async () => { const snapshot = await clearAllData(); await refresh(); return snapshot; }, [refresh]);
  const restore = useCallback(async (snapshot: AppSnapshot) => { await restoreSnapshot(snapshot); await refresh(); }, [refresh]);

  const value = useMemo<AppContextValue>(() => ({ activeVehicle, addFuelLog: addLog, clearAllData: clear, createVehicle: addVehicle, deleteFuelLog: removeLog, error, fuelLogs, isLoading, refresh, restoreSnapshot: restore, seedSampleData: seed, setActiveVehicle: activate, settings, updateFuelLog: saveLog, updateSettings: saveSettings, updateVehicle: saveVehicle, vehicles }), [activeVehicle, addLog, activate, addVehicle, clear, error, fuelLogs, isLoading, refresh, removeLog, restore, saveLog, saveSettings, saveVehicle, seed, settings, vehicles]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { const context = useContext(AppContext); if (!context) throw new Error("useApp must be used within AppProvider"); return context; }
