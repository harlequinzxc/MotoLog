"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { recalculateVehicleFillUps } from "@/lib/calculations";
import { toCalendarDate } from "@/lib/date";
import { generateDemoData, type DemoData } from "@/lib/demoData";
import { createId } from "@/lib/ids";
import {
  clearAppData,
  getAppData,
  setAppData,
  STORAGE_KEYS,
} from "@/lib/storage";
import {
  DEFAULT_APP_SETTINGS,
  type AppData,
  type AppSettings,
  type FillUp,
  type FillUpInput,
  type Vehicle,
  type VehicleInput,
} from "@/lib/types";

interface AppState extends AppData {
  isHydrated: boolean;
}

type VehicleChanges = Partial<
  Omit<Vehicle, "id" | "createdAt" | "updatedAt">
>;
type FillUpChanges = Partial<Omit<FillUpInput, "vehicleId">>;

type AppAction =
  | { type: "hydrate"; data: AppData }
  | { type: "addVehicle"; vehicle: Vehicle }
  | { type: "updateVehicle"; id: string; changes: VehicleChanges; updatedAt: string }
  | { type: "deleteVehicle"; id: string; updatedAt: string }
  | { type: "setActiveVehicle"; id: string; updatedAt: string }
  | { type: "addFillUp"; fillUp: FillUp; updatedAt: string }
  | { type: "updateFillUp"; id: string; changes: FillUpChanges; updatedAt: string }
  | { type: "deleteFillUp"; id: string; updatedAt: string }
  | { type: "updateSettings"; changes: Partial<AppSettings> }
  | { type: "replaceData"; data: AppData }
  | { type: "addDemoData"; demo: DemoData; updatedAt: string }
  | { type: "clearData" };

const initialState: AppState = {
  vehicles: [],
  fillUps: [],
  settings: { ...DEFAULT_APP_SETTINGS },
  isHydrated: false,
};

function chooseOneActive(vehicles: Vehicle[], preferredId?: string) {
  const activeId = preferredId ?? vehicles.find((vehicle) => vehicle.isActive)?.id ?? vehicles[0]?.id;

  return vehicles.map((vehicle) =>
    vehicle.isActive === (vehicle.id === activeId)
      ? vehicle
      : { ...vehicle, isActive: vehicle.id === activeId },
  );
}

function syncCurrentOdometers(
  vehicles: Vehicle[],
  fillUps: FillUp[],
  updatedAt?: string,
) {
  return vehicles.map((vehicle) => {
    const latestOdometer = fillUps.reduce((highestOdometer, fillUp) => {
      if (fillUp.vehicleId !== vehicle.id || !Number.isFinite(fillUp.odometer)) {
        return highestOdometer;
      }

      return Math.max(highestOdometer, fillUp.odometer);
    }, vehicle.startingOdometer);

    return vehicle.currentOdometer === latestOdometer
      ? vehicle
      : {
          ...vehicle,
          currentOdometer: latestOdometer,
          updatedAt: updatedAt ?? vehicle.updatedAt,
        };
  });
}

function normalizeFillUpDates(fillUps: FillUp[]) {
  return fillUps.map((fillUp) => {
    const date = toCalendarDate(fillUp.date);
    return date === fillUp.date ? fillUp : { ...fillUp, date };
  });
}

function recalculateAllFillUps(vehicles: Vehicle[], fillUps: FillUp[]) {
  return vehicles.reduce(
    (currentFillUps, vehicle) =>
      recalculateVehicleFillUps(vehicle, currentFillUps),
    normalizeFillUpDates(fillUps),
  );
}

function recalculateOneVehicleFillUps(
  vehicles: Vehicle[],
  fillUps: FillUp[],
  vehicleId: string,
) {
  const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
  const normalizedFillUps = normalizeFillUpDates(fillUps);
  return vehicle
    ? recalculateVehicleFillUps(vehicle, normalizedFillUps)
    : normalizedFillUps;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate": {
      const vehicles = chooseOneActive(action.data.vehicles);
      const fillUps = recalculateAllFillUps(vehicles, action.data.fillUps);

      return {
        ...action.data,
        vehicles: syncCurrentOdometers(vehicles, fillUps),
        fillUps,
        isHydrated: true,
      };
    }

    case "addVehicle": {
      const shouldBeActive =
        action.vehicle.isActive || !state.vehicles.some((vehicle) => vehicle.isActive);
      const existingVehicles = shouldBeActive
        ? state.vehicles.map((vehicle) =>
            vehicle.isActive ? { ...vehicle, isActive: false } : vehicle,
          )
        : state.vehicles;

      return {
        ...state,
        vehicles: [...existingVehicles, { ...action.vehicle, isActive: shouldBeActive }],
      };
    }

    case "updateVehicle": {
      const vehicle = state.vehicles.find((candidate) => candidate.id === action.id);
      if (!vehicle) {
        return state;
      }

      const updatedVehicle: Vehicle = {
        ...vehicle,
        ...action.changes,
        id: vehicle.id,
        createdAt: vehicle.createdAt,
        updatedAt: action.updatedAt,
      };
      const vehicles = state.vehicles.map((candidate) =>
        candidate.id === action.id ? updatedVehicle : candidate,
      );
      const withActiveVehicle = updatedVehicle.isActive
        ? chooseOneActive(vehicles, action.id)
        : vehicles;

      const fillUps = recalculateOneVehicleFillUps(
        withActiveVehicle,
        state.fillUps,
        action.id,
      );

      return {
        ...state,
        fillUps,
        vehicles: syncCurrentOdometers(
          withActiveVehicle,
          fillUps,
          action.updatedAt,
        ),
      };
    }

    case "deleteVehicle": {
      const remainingVehicles = state.vehicles.filter(
        (vehicle) => vehicle.id !== action.id,
      );
      const vehicles = chooseOneActive(remainingVehicles);

      return {
        ...state,
        vehicles,
        fillUps: state.fillUps.filter((fillUp) => fillUp.vehicleId !== action.id),
      };
    }

    case "setActiveVehicle": {
      if (!state.vehicles.some((vehicle) => vehicle.id === action.id)) {
        return state;
      }

      return {
        ...state,
        vehicles: state.vehicles.map((vehicle) => {
          const isActive = vehicle.id === action.id;
          return vehicle.isActive === isActive
            ? vehicle
            : { ...vehicle, isActive, updatedAt: action.updatedAt };
        }),
      };
    }

    case "addFillUp": {
      const fillUps = recalculateOneVehicleFillUps(
        state.vehicles,
        [...state.fillUps, action.fillUp],
        action.fillUp.vehicleId,
      );
      return {
        ...state,
        fillUps,
        vehicles: syncCurrentOdometers(state.vehicles, fillUps, action.updatedAt),
      };
    }

    case "updateFillUp": {
      const existingFillUp = state.fillUps.find((fillUp) => fillUp.id === action.id);
      if (!existingFillUp) {
        return state;
      }

      const changedFillUps = state.fillUps.map((fillUp) =>
        fillUp.id === action.id
          ? {
              ...fillUp,
              ...action.changes,
              id: fillUp.id,
              vehicleId: fillUp.vehicleId,
              createdAt: fillUp.createdAt,
              updatedAt: action.updatedAt,
            }
          : fillUp,
      );
      const fillUps = recalculateOneVehicleFillUps(
        state.vehicles,
        changedFillUps,
        existingFillUp.vehicleId,
      );

      return {
        ...state,
        fillUps,
        vehicles: syncCurrentOdometers(state.vehicles, fillUps, action.updatedAt),
      };
    }

    case "deleteFillUp": {
      const deletedFillUp = state.fillUps.find((fillUp) => fillUp.id === action.id);
      const remainingFillUps = state.fillUps.filter((fillUp) => fillUp.id !== action.id);
      const fillUps = deletedFillUp
        ? recalculateOneVehicleFillUps(
            state.vehicles,
            remainingFillUps,
            deletedFillUp.vehicleId,
          )
        : remainingFillUps;

      return {
        ...state,
        fillUps,
        vehicles: syncCurrentOdometers(state.vehicles, fillUps, action.updatedAt),
      };
    }

    case "updateSettings":
      return {
        ...state,
        settings: { ...state.settings, ...action.changes },
      };

    case "replaceData": {
      const vehicles = chooseOneActive(action.data.vehicles);
      const fillUps = recalculateAllFillUps(vehicles, action.data.fillUps);

      return {
        ...action.data,
        vehicles: syncCurrentOdometers(vehicles, fillUps),
        fillUps,
        isHydrated: true,
      };
    }

    case "addDemoData": {
      const hasActiveVehicle = state.vehicles.some((vehicle) => vehicle.isActive);
      const demoVehicle = {
        ...action.demo.vehicle,
        isActive: !hasActiveVehicle,
        updatedAt: action.updatedAt,
      };
      const vehicles = [...state.vehicles, demoVehicle];
      const fillUps = recalculateOneVehicleFillUps(
        vehicles,
        [...state.fillUps, ...action.demo.fillUps],
        demoVehicle.id,
      );

      return {
        ...state,
        vehicles: syncCurrentOdometers(vehicles, fillUps, action.updatedAt),
        fillUps,
      };
    }

    case "clearData":
      return {
        vehicles: [],
        fillUps: [],
        settings: { ...DEFAULT_APP_SETTINGS },
        isHydrated: true,
      };

    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  activeVehicle: Vehicle | null;
  addVehicle: (input: VehicleInput) => Vehicle;
  updateVehicle: (id: string, changes: VehicleChanges) => void;
  deleteVehicle: (id: string) => void;
  setActiveVehicle: (id: string) => void;
  addFillUp: (input: FillUpInput) => FillUp;
  updateFillUp: (id: string, changes: FillUpChanges) => void;
  deleteFillUp: (id: string) => void;
  updateSettings: (changes: Partial<AppSettings>) => void;
  replaceData: (data: AppData) => void;
  clearData: () => void;
  loadDemoData: () => Vehicle;
  getVehicleFillUps: (vehicleId: string) => FillUp[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function currentTimestamp() {
  return new Date().toISOString();
}

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Schedule hydration after the initial client render to keep SSR deterministic.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      dispatch({ type: "hydrate", data: getAppData() });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  // A second tab can update storage; keep this tab's context in sync as well.
  useEffect(() => {
    const storageKeys = new Set<string>(Object.values(STORAGE_KEYS));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || storageKeys.has(event.key)) {
        dispatch({ type: "hydrate", data: getAppData() });
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!state.isHydrated) {
      return;
    }

    setAppData({
      vehicles: state.vehicles,
      fillUps: state.fillUps,
      settings: state.settings,
    });
  }, [state.fillUps, state.isHydrated, state.settings, state.vehicles]);

  const addVehicle = useCallback((input: VehicleInput) => {
    const now = currentTimestamp();
    const startingOdometer = input.startingOdometer ?? 0;
    const currentOdometer = Math.max(
      startingOdometer,
      input.currentOdometer ?? startingOdometer,
    );
    const vehicle: Vehicle = {
      id: createId("vehicle"),
      type: input.type,
      name: input.name.trim(),
      year: input.year ?? null,
      tankCapacity: input.tankCapacity,
      reserve: input.reserve ?? 0,
      startingOdometer,
      currentOdometer,
      unitPreference: input.unitPreference ?? null,
      isActive: input.isActive ?? false,
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "addVehicle", vehicle });
    return vehicle;
  }, []);

  const updateVehicle = useCallback((id: string, changes: VehicleChanges) => {
    dispatch({
      type: "updateVehicle",
      id,
      changes,
      updatedAt: currentTimestamp(),
    });
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    dispatch({ type: "deleteVehicle", id, updatedAt: currentTimestamp() });
  }, []);

  const setActiveVehicle = useCallback((id: string) => {
    dispatch({ type: "setActiveVehicle", id, updatedAt: currentTimestamp() });
  }, []);

  const addFillUp = useCallback((input: FillUpInput) => {
    const now = currentTimestamp();
    const fillUp: FillUp = {
      id: createId("fill"),
      vehicleId: input.vehicleId,
      date: input.date || today(),
      odometer: input.odometer,
      fuelAdded: input.fuelAdded,
      totalCost: input.totalCost,
      isFullTank: input.isFullTank,
      station: input.station?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      distance: input.distance ?? null,
      economy: input.economy ?? null,
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "addFillUp", fillUp, updatedAt: now });
    return fillUp;
  }, []);

  const updateFillUp = useCallback((id: string, changes: FillUpChanges) => {
    dispatch({
      type: "updateFillUp",
      id,
      changes,
      updatedAt: currentTimestamp(),
    });
  }, []);

  const deleteFillUp = useCallback((id: string) => {
    dispatch({ type: "deleteFillUp", id, updatedAt: currentTimestamp() });
  }, []);

  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    dispatch({ type: "updateSettings", changes });
  }, []);

  const replaceData = useCallback((data: AppData) => {
    dispatch({ type: "replaceData", data });
  }, []);

  const clearData = useCallback(() => {
    clearAppData();
    dispatch({ type: "clearData" });
  }, []);

  const loadDemoData = useCallback(() => {
    const now = currentTimestamp();
    const demo = generateDemoData(new Date(now));
    dispatch({ type: "addDemoData", demo, updatedAt: now });
    return demo.vehicle;
  }, []);

  const getVehicleFillUps = useCallback(
    (vehicleId: string) =>
      state.fillUps
        .filter((fillUp) => fillUp.vehicleId === vehicleId)
        .sort(
          (first, second) =>
            first.date.localeCompare(second.date) || first.odometer - second.odometer,
        ),
    [state.fillUps],
  );

  const activeVehicle = useMemo(
    () => state.vehicles.find((vehicle) => vehicle.isActive) ?? null,
    [state.vehicles],
  );

  const value = useMemo(
    () => ({
      ...state,
      activeVehicle,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      setActiveVehicle,
      addFillUp,
      updateFillUp,
      deleteFillUp,
      updateSettings,
      replaceData,
      clearData,
      loadDemoData,
      getVehicleFillUps,
    }),
    [
      activeVehicle,
      addFillUp,
      addVehicle,
      clearData,
      deleteFillUp,
      deleteVehicle,
      getVehicleFillUps,
      loadDemoData,
      replaceData,
      setActiveVehicle,
      state,
      updateFillUp,
      updateSettings,
      updateVehicle,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside an AppProvider.");
  }

  return context;
}
