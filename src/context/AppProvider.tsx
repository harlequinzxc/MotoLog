import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  addFixedCost,
  createVehicleWithPresets,
  db,
  deleteVehicleWithRelations,
  ensureSettings,
  restoreVehicleSnapshot,
  setActiveVehicleId,
  updateTheme,
  updateVehicle
} from "@/lib/db";
import { seedSampleData } from "@/lib/seedSampleData";
import type { AppSettings, FixedCost, FixedCostInput, Vehicle, VehicleInput } from "@/types";

interface AppContextValue {
  activeVehicle: Vehicle | null;
  createVehicle: (input: VehicleInput) => Promise<Vehicle>;
  deleteVehicle: (vehicleId: string) => Promise<() => Promise<void>>;
  error: string | null;
  fixedCosts: FixedCost[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  seedSampleData: () => Promise<void>;
  setActiveVehicle: (vehicleId: string) => Promise<void>;
  settings: AppSettings | null;
  updateThemeMode: (themeMode: AppSettings["themeMode"]) => Promise<void>;
  updateVehicle: (vehicleId: string, input: VehicleInput) => Promise<void>;
  addFixedCost: (vehicleId: string, input: FixedCostInput) => Promise<void>;
  vehicles: Vehicle[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function applyTheme(themeMode: AppSettings["themeMode"]) {
  document.documentElement.classList.toggle("dark", themeMode === "dark");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const nextSettings = await ensureSettings();
      const [nextVehicles, nextFixedCosts] = await Promise.all([
        db.vehicles.orderBy("createdAt").toArray(),
        db.fixedCosts.orderBy("renewalAt").toArray()
      ]);
      setSettings(nextSettings);
      setVehicles(nextVehicles);
      setFixedCosts(nextFixedCosts);
      applyTheme(nextSettings.themeMode);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load local MotoLog data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createVehicle = useCallback(async (input: VehicleInput) => {
    const vehicle = await createVehicleWithPresets(input);
    await refresh();
    return vehicle;
  }, [refresh]);

  const saveVehicle = useCallback(async (vehicleId: string, input: VehicleInput) => {
    await updateVehicle(vehicleId, input);
    await refresh();
  }, [refresh]);

  const removeVehicle = useCallback(async (vehicleId: string) => {
    const snapshot = await deleteVehicleWithRelations(vehicleId);
    await refresh();
    return async () => {
      await restoreVehicleSnapshot(snapshot);
      await refresh();
    };
  }, [refresh]);

  const activateVehicle = useCallback(async (vehicleId: string) => {
    await setActiveVehicleId(vehicleId);
    await refresh();
  }, [refresh]);

  const saveThemeMode = useCallback(async (themeMode: AppSettings["themeMode"]) => {
    await updateTheme(themeMode);
    applyTheme(themeMode);
    await refresh();
  }, [refresh]);

  const createFixedCost = useCallback(async (vehicleId: string, input: FixedCostInput) => {
    await addFixedCost(vehicleId, input);
    await refresh();
  }, [refresh]);

  const seed = useCallback(async () => {
    await seedSampleData();
    await refresh();
  }, [refresh]);

  const activeVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === settings?.activeVehicleId) ?? vehicles[0] ?? null,
    [settings?.activeVehicleId, vehicles]
  );

  const value = useMemo<AppContextValue>(() => ({
    activeVehicle,
    addFixedCost: createFixedCost,
    createVehicle,
    deleteVehicle: removeVehicle,
    error,
    fixedCosts,
    isLoading,
    refresh,
    seedSampleData: seed,
    setActiveVehicle: activateVehicle,
    settings,
    updateThemeMode: saveThemeMode,
    updateVehicle: saveVehicle,
    vehicles
  }), [
    activeVehicle,
    activateVehicle,
    createFixedCost,
    createVehicle,
    error,
    fixedCosts,
    isLoading,
    refresh,
    removeVehicle,
    saveThemeMode,
    saveVehicle,
    seed,
    settings,
    vehicles
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
