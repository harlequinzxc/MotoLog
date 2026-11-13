import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  addCustomServiceItem,
  clearAllData,
  createExpense,
  createFuelLog,
  createServiceVisit,
  createVehicle,
  db,
  deleteExpense,
  deleteFuelLog,
  deleteServiceVisit,
  ensureSettings,
  readSnapshot,
  restoreSnapshot,
  setActiveVehicle,
  updateExpense,
  updateFuelLog,
  updateServiceVisit,
  updateSettings,
  updateVehicle
} from "@/lib/db";
import { systemPrefersReducedMotion, resolveReducedMotion } from "@/lib/motion";
import { seedSampleData } from "@/lib/seedSampleData";
import type {
  AppSettings,
  AppSnapshot,
  ExpenseInput,
  ExpenseRecord,
  FuelLog,
  FuelLogInput,
  ServiceItem,
  ServiceVisit,
  ServiceVisitInput,
  ServiceVisitItem,
  Vehicle,
  VehicleInput
} from "@/types";

interface AppContextValue {
  activeVehicle: Vehicle | null;
  addCustomServiceItem: (title: string) => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  addFuelLog: (input: FuelLogInput) => Promise<void>;
  addServiceVisit: (input: ServiceVisitInput) => Promise<void>;
  clearAllData: () => Promise<AppSnapshot>;
  createVehicle: (input: VehicleInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<AppSnapshot>;
  deleteFuelLog: (id: string) => Promise<AppSnapshot | undefined>;
  deleteServiceVisit: (id: string) => Promise<AppSnapshot>;
  error: string | null;
  expenseRecords: ExpenseRecord[];
  fuelLogs: FuelLog[];
  isLoading: boolean;
  reducedMotion: boolean;
  refresh: () => Promise<void>;
  restoreSnapshot: (snapshot: AppSnapshot) => Promise<void>;
  seedSampleData: () => Promise<void>;
  serviceItems: ServiceItem[];
  serviceVisitItems: ServiceVisitItem[];
  serviceVisits: ServiceVisit[];
  setActiveVehicle: (id: string) => Promise<void>;
  settings: AppSettings | null;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  updateFuelLog: (id: string, input: FuelLogInput) => Promise<void>;
  updateServiceVisit: (id: string, input: ServiceVisitInput) => Promise<void>;
  updateSettings: (changes: Partial<Omit<AppSettings, "id" | "createdAt">>) => Promise<void>;
  updateVehicle: (id: string, input: VehicleInput) => Promise<void>;
  vehicles: Vehicle[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function applyTheme(theme: AppSettings["themeMode"]) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyReducedMotion(reducedMotion: boolean) {
  document.documentElement.dataset.reducedMotion = String(reducedMotion);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [serviceVisits, setServiceVisits] = useState<ServiceVisit[]>([]);
  const [serviceVisitItems, setServiceVisitItems] = useState<ServiceVisitItem[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(systemPrefersReducedMotion);

  const refresh = useCallback(async () => {
    try {
      const nextSettings = await ensureSettings();
      const [nextVehicles, nextLogs, nextItems, nextVisits, nextLinks, nextExpenses] = await Promise.all([
        db.vehicles.orderBy("createdAt").toArray(),
        db.fuelLogs.orderBy("occurredAt").reverse().toArray(),
        db.serviceItems.toArray().then((items) => items.sort((first, second) => first.title.localeCompare(second.title))),
        db.serviceVisits.orderBy("occurredAt").reverse().toArray(),
        db.serviceVisitItems.toArray(),
        db.expenseRecords.orderBy("occurredAt").reverse().toArray()
      ]);
      const nextReducedMotion = resolveReducedMotion(nextSettings.reducedMotion);
      applyTheme(nextSettings.themeMode);
      applyReducedMotion(nextReducedMotion);
      setSettings(nextSettings);
      setVehicles(nextVehicles);
      setFuelLogs(nextLogs);
      setServiceItems(nextItems);
      setServiceVisits(nextVisits);
      setServiceVisitItems(nextLinks);
      setExpenseRecords(nextExpenses);
      setReducedMotion(nextReducedMotion);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to read local MotoLog data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (settings?.reducedMotion !== null || typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateFromSystem = () => {
      const nextReducedMotion = mediaQuery.matches;
      applyReducedMotion(nextReducedMotion);
      setReducedMotion(nextReducedMotion);
    };
    mediaQuery.addEventListener("change", updateFromSystem);
    return () => mediaQuery.removeEventListener("change", updateFromSystem);
  }, [settings?.reducedMotion]);

  const activeVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === settings?.activeVehicleId) ?? vehicles[0] ?? null,
    [settings?.activeVehicleId, vehicles]
  );
  const addVehicle = useCallback(async (input: VehicleInput) => { await createVehicle(input); await refresh(); }, [refresh]);
  const saveVehicle = useCallback(async (id: string, input: VehicleInput) => { await updateVehicle(id, input); await refresh(); }, [refresh]);
  const activate = useCallback(async (id: string) => { await setActiveVehicle(id); await refresh(); }, [refresh]);
  const addLog = useCallback(async (input: FuelLogInput) => {
    if (!activeVehicle) throw new Error("Add a vehicle before logging fuel.");
    await createFuelLog(activeVehicle.id, input);
    await refresh();
  }, [activeVehicle, refresh]);
  const saveLog = useCallback(async (id: string, input: FuelLogInput) => { await updateFuelLog(id, input); await refresh(); }, [refresh]);
  const removeLog = useCallback(async (id: string) => { const snapshot = await deleteFuelLog(id); await refresh(); return snapshot; }, [refresh]);
  const addItem = useCallback(async (title: string) => {
    if (!activeVehicle) throw new Error("Choose a vehicle first.");
    await addCustomServiceItem(activeVehicle.id, title);
    await refresh();
  }, [activeVehicle, refresh]);
  const addVisit = useCallback(async (input: ServiceVisitInput) => {
    if (!activeVehicle) throw new Error("Choose a vehicle first.");
    await createServiceVisit(activeVehicle.id, input);
    await refresh();
  }, [activeVehicle, refresh]);
  const saveVisit = useCallback(async (id: string, input: ServiceVisitInput) => { await updateServiceVisit(id, input); await refresh(); }, [refresh]);
  const removeVisit = useCallback(async (id: string) => { const snapshot = await deleteServiceVisit(id); await refresh(); return snapshot; }, [refresh]);
  const addExpense = useCallback(async (input: ExpenseInput) => {
    if (!activeVehicle) throw new Error("Choose a vehicle first.");
    await createExpense(activeVehicle.id, input);
    await refresh();
  }, [activeVehicle, refresh]);
  const saveExpense = useCallback(async (id: string, input: ExpenseInput) => { await updateExpense(id, input); await refresh(); }, [refresh]);
  const removeExpense = useCallback(async (id: string) => { const snapshot = await deleteExpense(id); await refresh(); return snapshot; }, [refresh]);
  const saveSettings = useCallback(async (changes: Partial<Omit<AppSettings, "id" | "createdAt">>) => { await updateSettings(changes); await refresh(); }, [refresh]);
  const seed = useCallback(async () => { await seedSampleData(); await refresh(); }, [refresh]);
  const clear = useCallback(async () => { const snapshot = await clearAllData(); await refresh(); return snapshot; }, [refresh]);
  const restore = useCallback(async (snapshot: AppSnapshot) => { await restoreSnapshot(snapshot); await refresh(); }, [refresh]);

  const value = useMemo<AppContextValue>(() => ({
    activeVehicle,
    addCustomServiceItem: addItem,
    addExpense,
    addFuelLog: addLog,
    addServiceVisit: addVisit,
    clearAllData: clear,
    createVehicle: addVehicle,
    deleteExpense: removeExpense,
    deleteFuelLog: removeLog,
    deleteServiceVisit: removeVisit,
    error,
    expenseRecords,
    fuelLogs,
    isLoading,
    reducedMotion,
    refresh,
    restoreSnapshot: restore,
    seedSampleData: seed,
    serviceItems,
    serviceVisitItems,
    serviceVisits,
    setActiveVehicle: activate,
    settings,
    updateExpense: saveExpense,
    updateFuelLog: saveLog,
    updateServiceVisit: saveVisit,
    updateSettings: saveSettings,
    updateVehicle: saveVehicle,
    vehicles
  }), [activeVehicle, addExpense, addItem, addLog, addVehicle, addVisit, activate, clear, error, expenseRecords, fuelLogs, isLoading, reducedMotion, refresh, removeExpense, removeLog, removeVisit, restore, saveExpense, saveLog, saveSettings, saveVehicle, saveVisit, seed, serviceItems, serviceVisitItems, serviceVisits, settings, vehicles]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
