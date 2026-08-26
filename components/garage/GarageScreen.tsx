"use client";

import {
  Bike,
  CarFront,
  Fuel,
  Gauge,
  Plus,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { VehicleCard } from "@/components/garage/VehicleCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppContext } from "@/context/AppContext";
import { APP_NAME } from "@/lib/constants";
import type { UnitPreference, Vehicle, VehicleType } from "@/lib/types";

type UnitPreferenceChoice = "metric" | "imperial";

interface VehicleFormState {
  name: string;
  reserve: string;
  startingOdometer: string;
  tankCapacity: string;
  type: VehicleType;
  unitPreference: UnitPreferenceChoice;
  year: string;
}

type FormErrors = Partial<Record<"name" | "tankCapacity", string>>;

const CURRENT_YEAR = new Date().getFullYear();
const IMPERIAL_GALLON_IN_LITRES = 4.546_09;
const MILE_IN_KILOMETRES = 1.609_344;

function createEmptyForm(
  unitPreference: UnitPreferenceChoice = "metric",
): VehicleFormState {
  return {
    type: "motorcycle",
    name: "",
    year: "",
    tankCapacity: "",
    reserve: "",
    startingOdometer: "",
    unitPreference,
  };
}

function getUnitPreference(
  choice: UnitPreferenceChoice,
): Partial<UnitPreference> {
  return choice === "metric"
    ? { distance: "km", volume: "L", consumption: "km/L" }
    : { distance: "mi", volume: "gal-uk", consumption: "mpg-uk" };
}

function numberOrDefault(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toStoredVolume(value: number, isImperial: boolean) {
  return isImperial ? value * IMPERIAL_GALLON_IN_LITRES : value;
}

function toStoredDistance(value: number, isImperial: boolean) {
  return isImperial ? value * MILE_IN_KILOMETRES : value;
}

function fromStoredVolume(value: number, isImperial: boolean) {
  return isImperial ? value / IMPERIAL_GALLON_IN_LITRES : value;
}

function fromStoredDistance(value: number, isImperial: boolean) {
  return isImperial ? value / MILE_IN_KILOMETRES : value;
}

function formatFormNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function getVehicleUnitChoice(vehicle: Vehicle): UnitPreferenceChoice {
  return vehicle.unitPreference?.distance === "mi" ? "imperial" : "metric";
}

interface GarageScreenProps {
  variant?: "dashboard" | "garage";
}

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

/**
 * The Garage destination owns the add-vehicle sheet and is deliberately shared
 * with the empty dashboard, so the first-run experience is identical anywhere.
 */
export function GarageScreen({ variant = "garage" }: GarageScreenProps) {
  const {
    addVehicle,
    deleteVehicle,
    getVehicleFillUps,
    isHydrated,
    loadDemoData,
    setActiveVehicle,
    settings,
    updateVehicle,
    vehicles,
  } = useAppContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehiclePendingDelete, setVehiclePendingDelete] = useState<Vehicle | null>(
    null,
  );
  const [form, setForm] = useState<VehicleFormState>(createEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const editingVehicle =
    vehicles.find((vehicle) => vehicle.id === editingVehicleId) ?? null;

  const openVehicleSheet = (vehicle?: Vehicle) => {
    if (vehicle) {
      const unitPreference = getVehicleUnitChoice(vehicle);
      const isImperial = unitPreference === "imperial";

      setForm({
        type: vehicle.type,
        name: vehicle.name,
        year: vehicle.year?.toString() ?? "",
        tankCapacity: formatFormNumber(
          fromStoredVolume(vehicle.tankCapacity, isImperial),
        ),
        reserve: formatFormNumber(fromStoredVolume(vehicle.reserve, isImperial)),
        startingOdometer: formatFormNumber(
          fromStoredDistance(vehicle.startingOdometer, isImperial),
        ),
        unitPreference,
      });
      setEditingVehicleId(vehicle.id);
    } else {
      setForm(createEmptyForm(settings.distanceUnit === "mi" ? "imperial" : "metric"));
      setEditingVehicleId(null);
    }

    setErrors({});
    setIsSheetOpen(true);
  };

  const closeVehicleSheet = () => {
    setIsSheetOpen(false);
    setEditingVehicleId(null);
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tankInput = numberOrDefault(form.tankCapacity, Number.NaN);
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Give this vehicle a name.";
    }

    if (
      !form.tankCapacity.trim() ||
      !Number.isFinite(tankInput) ||
      tankInput <= 0
    ) {
      nextErrors.tankCapacity = "Enter a tank capacity greater than zero.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const isImperial = form.unitPreference === "imperial";
    const parsedYear = numberOrDefault(form.year, Number.NaN);
    const vehicleValues = {
      type: form.type,
      name: form.name,
      year: Number.isFinite(parsedYear) ? parsedYear : null,
      // Storage stays metric even when this form is presented in imperial units.
      tankCapacity: toStoredVolume(tankInput, isImperial),
      reserve: Math.max(
        toStoredVolume(numberOrDefault(form.reserve), isImperial),
        0,
      ),
      startingOdometer: Math.max(
        toStoredDistance(numberOrDefault(form.startingOdometer), isImperial),
        0,
      ),
      unitPreference: getUnitPreference(form.unitPreference),
    };

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, vehicleValues);
    } else {
      addVehicle({ ...vehicleValues, isActive: vehicles.length === 0 });
    }

    closeVehicleSheet();
  };

  const updateForm = <Key extends keyof VehicleFormState>(
    key: Key,
    value: VehicleFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "name" || key === "tankCapacity") {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const confirmVehicleDelete = () => {
    if (!vehiclePendingDelete) {
      return;
    }

    deleteVehicle(vehiclePendingDelete.id);
    setVehiclePendingDelete(null);
  };

  const sortedVehicles = [...vehicles].sort(
    (first, second) =>
      Number(second.isActive) - Number(first.isActive) ||
      first.createdAt.localeCompare(second.createdAt),
  );
  const vehicleCount = vehicles.length;
  const pendingFillUpCount = vehiclePendingDelete
    ? getVehicleFillUps(vehiclePendingDelete.id).length
    : 0;
  const isMotorcycle = form.type === "motorcycle";
  const NameIcon = isMotorcycle ? Bike : CarFront;
  const fuelUnit = form.unitPreference === "metric" ? "litres" : "gallons";
  const distanceUnit = form.unitPreference === "metric" ? "km" : "mi";
  const vehicleTypeCopy = isMotorcycle
    ? {
        namePlaceholder: "e.g. Yamaha MT-15",
        reservePlaceholder: "e.g. 2.0",
        tankHelper: "typical bike: 9–21 L",
        tankPlaceholder: "14.0",
      }
    : {
        namePlaceholder: "e.g. Honda Civic FD4",
        reservePlaceholder: "e.g. 7.0",
        tankHelper: "typical car: 40–70 L",
        tankPlaceholder: "50.0",
      };

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-[480px] flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {variant === "dashboard" ? (
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-text-primary shadow-accent-glow">
              <Fuel aria-hidden="true" size={21} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight text-text-primary">
                Moto<span className="text-accent">Log</span>
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.08em] text-text-muted">
                RIDE SMARTER. GO FURTHER.
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium tracking-[0.08em] text-text-muted">TODAY</p>
            <p className="mt-1 font-mono text-sm font-bold tabular-nums text-text-primary">
              {todayLabel()}
            </p>
          </div>
        </header>
      ) : (
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium tracking-[0.08em] text-text-muted">
              CARS & BIKES
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
              Garage{vehicleCount > 0 ? <span className="ml-2 text-lg font-medium text-text-muted">{vehicleCount}</span> : null}
            </h1>
          </div>
          <button
            className="mb-0.5 flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-text-primary shadow-accent-glow"
            onClick={() => openVehicleSheet()}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
            Add vehicle
          </button>
        </header>
      )}

      <div className="flex flex-1 flex-col py-10">
        {!isHydrated ? (
          <div className="my-auto rounded-3xl border border-border-default bg-bg-card p-6 text-center">
            <div className="mx-auto h-16 w-16 animate-pulse rounded-3xl bg-bg-input" />
            <div className="mx-auto mt-6 h-5 w-40 animate-pulse rounded bg-bg-input" />
            <div className="mx-auto mt-3 h-4 w-56 animate-pulse rounded bg-bg-input" />
          </div>
        ) : vehicleCount === 0 ? (
          <article className="my-auto rounded-2xl border border-border-default bg-bg-card px-6 py-8 text-center shadow-[0_16px_44px_rgb(0_0_0_/_0.2)]">
            <span className="mx-auto flex w-fit items-center gap-3 rounded-2xl bg-accent/10 p-4 text-accent">
              <Bike aria-hidden="true" size={26} strokeWidth={2.1} />
              <CarFront aria-hidden="true" size={26} strokeWidth={2.1} />
            </span>
            <h1 className="mt-6 text-xl font-bold tracking-tight text-text-primary">
              {variant === "dashboard" ? "Your garage is empty" : "No vehicles yet"}
            </h1>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-text-secondary">
              Add your first car or motorcycle to start tracking fuel mileage and expenses.
            </p>
            <div className="mt-7 grid gap-3">
              <button
                className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-text-primary shadow-[0_4px_24px_rgb(var(--color-accent)_/_0.35)]"
                onClick={() => openVehicleSheet()}
                type="button"
              >
                <Plus aria-hidden="true" size={18} strokeWidth={2.7} />
                {variant === "dashboard" ? "Add your first vehicle" : "Add a vehicle"}
              </button>
              <button
                className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-border-default bg-transparent px-5 text-sm font-medium text-text-muted hover:border-accent/40 hover:text-text-secondary"
                onClick={loadDemoData}
                type="button"
              >
                <Sparkles aria-hidden="true" size={17} className="text-accent" />
                Load demo ride data
              </button>
            </div>
            <p className="mt-5 text-[11px] italic leading-5 text-text-muted">
              Vehicle data stays private on this device.
            </p>
          </article>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-4">
              {sortedVehicles.map((vehicle) => (
                <VehicleCard
                  fillUps={getVehicleFillUps(vehicle.id)}
                  key={vehicle.id}
                  onDelete={() => setVehiclePendingDelete(vehicle)}
                  onEdit={() => openVehicleSheet(vehicle)}
                  onSetActive={() => setActiveVehicle(vehicle.id)}
                  settings={settings}
                  vehicle={vehicle}
                />
              ))}
            </div>
          </div>
        )}
      </div>


      <BottomSheet
        isOpen={isSheetOpen}
        onClose={closeVehicleSheet}
        title={editingVehicle ? "Edit vehicle" : "Add a vehicle"}
      >
        <form className="pb-2" noValidate onSubmit={handleSubmit}>
          <fieldset>
            <legend className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
              VEHICLE TYPE
            </legend>
            <div
              aria-label="Vehicle type"
              className="mt-3 grid grid-cols-2 rounded-full border border-border-default bg-bg-input p-1"
              role="group"
            >
              {(
                [
                  ["motorcycle", "Motorcycle", Bike],
                  ["car", "Car", CarFront],
                ] as const
              ).map(([type, label, Icon]) => {
                const selected = form.type === type;
                return (
                  <button
                    aria-pressed={selected}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-2 py-2 text-sm font-bold transition-all ${
                      selected
                        ? "bg-accent text-text-primary shadow-accent-glow"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                    key={type}
                    onClick={() => updateForm("type", type)}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={2.3} />
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-6">
            <label className="grid gap-2">
              <span className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
                NAME / MODEL <span className="text-accent">*</span>
              </span>
              <div className="relative">
                <NameIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={19}
                />
                <input
                  aria-describedby={errors.name ? "vehicle-name-error" : undefined}
                  aria-invalid={Boolean(errors.name)}
                  autoComplete="off"
                  autoFocus
                  className={`h-14 w-full rounded-2xl border bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted ${
                    errors.name ? "border-red-400" : "border-border-default"
                  }`}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder={vehicleTypeCopy.namePlaceholder}
                  type="text"
                  value={form.name}
                />
              </div>
              {errors.name ? (
                <span className="text-xs font-medium text-red-400" id="vehicle-name-error">
                  {errors.name}
                </span>
              ) : null}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
                  YEAR
                </span>
                <input
                  className="h-14 w-full rounded-2xl border border-border-default bg-bg-input px-4 text-base font-medium text-text-primary placeholder:text-text-muted"
                  inputMode="numeric"
                  max={CURRENT_YEAR + 1}
                  min="1886"
                  onChange={(event) => updateForm("year", event.target.value)}
                  placeholder="2024"
                  type="number"
                  value={form.year}
                />
                <span className="text-xs text-text-muted">optional</span>
              </label>

              <label className="grid gap-2">
                <span className="flex items-center justify-between gap-1 text-[10px] font-bold tracking-[0.08em] text-text-muted">
                  <span>TANK CAPACITY <span className="text-accent">*</span></span>
                  <span className="normal-case tracking-normal">{fuelUnit}</span>
                </span>
                <input
                  aria-describedby={
                    errors.tankCapacity ? "tank-capacity-error" : undefined
                  }
                  aria-invalid={Boolean(errors.tankCapacity)}
                  className={`h-14 w-full rounded-2xl border bg-bg-input px-4 text-base font-medium text-text-primary placeholder:text-text-muted ${
                    errors.tankCapacity ? "border-red-400" : "border-border-default"
                  }`}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    updateForm("tankCapacity", event.target.value)
                  }
                  placeholder={vehicleTypeCopy.tankPlaceholder}
                  step="0.1"
                  type="number"
                  value={form.tankCapacity}
                />
                {errors.tankCapacity ? (
                  <span className="text-xs font-medium text-red-400" id="tank-capacity-error">
                    {errors.tankCapacity}
                  </span>
                ) : (
                  <span className="text-xs leading-4 text-text-muted">
                    {vehicleTypeCopy.tankHelper}
                  </span>
                )}
              </label>
            </div>

            <label className="grid gap-2">
              <span className="flex items-center justify-between gap-2 text-[11px] font-bold tracking-[0.12em] text-text-muted">
                <span>RESERVE / LOW FUEL</span>
                <span className="normal-case tracking-normal">{fuelUnit}</span>
              </span>
              <div className="relative">
                <TriangleAlert
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent"
                  size={19}
                />
                <input
                  className="h-14 w-full rounded-xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-[15px] font-medium text-text-primary placeholder:text-text-muted"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => updateForm("reserve", event.target.value)}
                  placeholder={vehicleTypeCopy.reservePlaceholder}
                  step="0.1"
                  type="number"
                  value={form.reserve}
                />
              </div>
              <span className="text-xs leading-4 text-text-muted">
                Fuel remaining when the low-fuel light comes on.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center justify-between gap-2 text-[11px] font-bold tracking-[0.12em] text-text-muted">
                <span>STARTING ODOMETER</span>
                <span className="normal-case tracking-normal">{distanceUnit}</span>
              </span>
              <div className="relative">
                <Gauge
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={19}
                />
                <input
                  className="h-14 w-full rounded-2xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    updateForm("startingOdometer", event.target.value)
                  }
                  placeholder="0"
                  step="1"
                  type="number"
                  value={form.startingOdometer}
                />
              </div>
              <span className="text-xs leading-4 text-text-muted">
                The reading when you start tracking — future logs must be higher.
              </span>
            </label>

            <fieldset>
              <legend className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
                FUEL UNIT PREFERENCE
              </legend>
              <div className="mt-3 grid grid-cols-2 rounded-full border border-border-default bg-bg-input p-1">
                {(
                  [
                    ["metric", "Metric · km & Litres"],
                    ["imperial", "Imperial · mi & Gallons"],
                  ] as const
                ).map(([choice, label]) => {
                  const selected = form.unitPreference === choice;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`min-h-12 rounded-full px-2 py-2 text-center text-[11px] font-bold leading-4 transition-all ${
                        selected
                          ? "bg-accent text-text-primary shadow-accent-glow"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                      key={choice}
                      onClick={() => updateForm("unitPreference", choice)}
                      type="button"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="sticky bottom-0 -mx-6 mt-8 border-t border-border-default bg-bg-base/95 px-6 pb-5 pt-5 backdrop-blur-xl">
            <button
              className="h-14 w-full rounded-2xl bg-accent px-6 text-base font-bold text-text-primary shadow-[0_4px_20px_rgb(var(--color-accent)_/_0.35)] hover:brightness-110"
              type="submit"
            >
              {editingVehicle ? "Save changes" : "Add to garage"}
            </button>
          </div>
        </form>
      </BottomSheet>

      <ConfirmDialog
        confirmLabel="Delete vehicle"
        description={
          vehiclePendingDelete
            ? `This removes ${vehiclePendingDelete.name} and ${pendingFillUpCount} associated ${pendingFillUpCount === 1 ? "fill-up" : "fill-ups"} from this device. This cannot be undone.`
            : ""
        }
        isOpen={Boolean(vehiclePendingDelete)}
        onCancel={() => setVehiclePendingDelete(null)}
        onConfirm={confirmVehicleDelete}
        title="Delete vehicle?"
      />
    </section>
  );
}
