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

import { MotoMark } from "@/components/branding/MotoMark";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAppContext } from "@/context/AppContext";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import type { UnitPreference, VehicleType } from "@/lib/types";

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

function createEmptyForm(): VehicleFormState {
  return {
    type: "motorcycle",
    name: "",
    year: "",
    tankCapacity: "",
    reserve: "",
    startingOdometer: "",
    unitPreference: "metric",
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

/**
 * The Garage destination owns the add-vehicle sheet and is deliberately shared
 * with the empty dashboard, so the first-run experience is identical anywhere.
 */
export function GarageScreen() {
  const { addVehicle, isHydrated, loadDemoData, vehicles } = useAppContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [form, setForm] = useState<VehicleFormState>(createEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const openVehicleSheet = () => {
    setForm(createEmptyForm());
    setErrors({});
    setIsSheetOpen(true);
  };

  const closeVehicleSheet = () => {
    setIsSheetOpen(false);
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
    addVehicle({
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
      isActive: vehicles.length === 0,
    });
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

  const vehicleCount = vehicles.length;
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
    <section className="mx-auto flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-lg flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MotoMark size={31} />
          <span className="text-sm font-bold tracking-tight text-text-primary">
            {APP_NAME}
          </span>
        </div>
        <span className="rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs font-medium text-text-secondary">
          {APP_VERSION}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">
        {!isHydrated ? (
          <div className="rounded-3xl border border-border-default bg-bg-card p-6 text-center">
            <div className="mx-auto h-16 w-16 animate-pulse rounded-3xl bg-bg-input" />
            <div className="mx-auto mt-6 h-5 w-40 animate-pulse rounded bg-bg-input" />
            <div className="mx-auto mt-3 h-4 w-56 animate-pulse rounded bg-bg-input" />
          </div>
        ) : vehicleCount === 0 ? (
          <article className="rounded-3xl border border-border-default bg-bg-card p-6 text-center shadow-[0_18px_48px_rgb(0_0_0_/_0.18)]">
            <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent shadow-accent-glow">
              <Bike aria-hidden="true" size={30} strokeWidth={2} />
            </span>
            <p className="mt-7 text-xs font-bold tracking-[0.18em] text-accent">
              YOUR GARAGE
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              No vehicles yet
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-text-secondary">
              Add your first ride to start tracking fuel, mileage, and costs.
            </p>
            <div className="mt-8 grid gap-3">
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-bold text-text-primary shadow-accent-glow transition-transform hover:brightness-110 active:scale-[0.98]"
                onClick={openVehicleSheet}
                type="button"
              >
                <Plus aria-hidden="true" size={18} strokeWidth={2.7} />
                Add a vehicle
              </button>
              <button
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border-default bg-bg-input px-4 text-sm font-semibold text-text-primary transition-colors hover:border-accent/40 hover:bg-bg-card"
                onClick={loadDemoData}
                type="button"
              >
                <Sparkles aria-hidden="true" size={17} className="text-accent" />
                Load demo data
              </button>
            </div>
            <p className="mt-5 text-xs leading-5 text-text-muted">
              Demo data adds a Yamaha MT-15 and 12 fill-ups to this device.
            </p>
          </article>
        ) : (
          <article className="rounded-3xl border border-border-default bg-bg-card p-6 text-center shadow-[0_18px_48px_rgb(0_0_0_/_0.18)]">
            <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent shadow-accent-glow">
              <Fuel aria-hidden="true" size={28} strokeWidth={2} />
            </span>
            <p className="mt-7 text-xs font-bold tracking-[0.18em] text-accent">
              GARAGE READY
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"} saved
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-text-secondary">
              Your vehicle is safely stored on this device. Full garage cards
              arrive in the next update.
            </p>
            <button
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border-default bg-bg-input px-4 text-sm font-semibold text-text-primary transition-colors hover:border-accent/40 hover:bg-bg-card"
              onClick={openVehicleSheet}
              type="button"
            >
              <Plus aria-hidden="true" size={18} className="text-accent" />
              Add another vehicle
            </button>
          </article>
        )}
      </div>

      <p className="text-center text-xs text-text-muted">
        Vehicle data stays private on this device.
      </p>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={closeVehicleSheet}
        title="Add a vehicle"
      >
        <form className="pb-2" noValidate onSubmit={handleSubmit}>
          <fieldset>
            <legend className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
              VEHICLE TYPE
            </legend>
            <div
              aria-label="Vehicle type"
              className="mt-3 grid grid-cols-2 rounded-2xl border border-border-default bg-bg-input p-1"
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
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-bold transition-all ${
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
                  className={`h-[3.25rem] w-full rounded-2xl border bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted ${
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
                  className="h-[3.25rem] w-full rounded-2xl border border-border-default bg-bg-input px-4 text-base font-medium text-text-primary placeholder:text-text-muted"
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
                  className={`h-[3.25rem] w-full rounded-2xl border bg-bg-input px-4 text-base font-medium text-text-primary placeholder:text-text-muted ${
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
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={19}
                />
                <input
                  className="h-[3.25rem] w-full rounded-2xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted"
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
                  className="h-[3.25rem] w-full rounded-2xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted"
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
              <div className="mt-3 grid grid-cols-2 rounded-2xl border border-border-default bg-bg-input p-1">
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
                      className={`min-h-12 rounded-xl px-2 py-2 text-center text-[11px] font-bold leading-4 transition-all ${
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

          <div className="mt-8 border-t border-border-default pt-5">
            <button
              className="h-[3.25rem] w-full rounded-2xl bg-accent px-4 text-sm font-bold text-text-primary shadow-accent-glow transition-transform hover:brightness-110 active:scale-[0.98]"
              type="submit"
            >
              Add to garage
            </button>
          </div>
        </form>
      </BottomSheet>
    </section>
  );
}
