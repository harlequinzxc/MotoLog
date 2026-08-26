"use client";

import { Bike, CarFront, ChevronDown, Fuel, Plus, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import { MotoMark } from "@/components/branding/MotoMark";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAppContext } from "@/context/AppContext";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import type { UnitPreference, VehicleType } from "@/lib/types";

type UnitPreferenceChoice = "inherit" | "metric" | "us" | "uk";

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

function createEmptyForm(): VehicleFormState {
  return {
    type: "motorcycle",
    name: "",
    year: "",
    tankCapacity: "",
    reserve: "",
    startingOdometer: "0",
    unitPreference: "inherit",
  };
}

function getUnitPreference(
  choice: UnitPreferenceChoice,
): Partial<UnitPreference> | null {
  switch (choice) {
    case "metric":
      return { distance: "km", volume: "L", consumption: "km/L" };
    case "us":
      return { distance: "mi", volume: "gal-us", consumption: "mpg-us" };
    case "uk":
      return { distance: "mi", volume: "gal-uk", consumption: "mpg-uk" };
    default:
      return null;
  }
}

function numberOrDefault(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function GarageScreen() {
  const { addVehicle, isHydrated, loadDemoData, settings, vehicles } =
    useAppContext();
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

    const tankCapacity = numberOrDefault(form.tankCapacity, Number.NaN);
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Give this vehicle a name.";
    }

    if (
      !form.tankCapacity.trim() ||
      !Number.isFinite(tankCapacity) ||
      tankCapacity <= 0
    ) {
      nextErrors.tankCapacity = "Enter a tank capacity greater than zero.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const parsedYear = numberOrDefault(form.year, Number.NaN);
    addVehicle({
      type: form.type,
      name: form.name,
      year: Number.isFinite(parsedYear) ? parsedYear : null,
      tankCapacity,
      reserve: Math.max(numberOrDefault(form.reserve), 0),
      startingOdometer: Math.max(numberOrDefault(form.startingOdometer), 0),
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
            <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent shadow-accent">
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
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-bold text-text-primary shadow-accent transition-transform hover:brightness-110 active:scale-[0.98]"
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
            <span className="mx-auto grid size-16 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent shadow-accent">
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
            <legend className="text-sm font-semibold text-text-primary">
              Vehicle type
            </legend>
            <div className="mt-3 grid grid-cols-2 rounded-2xl bg-bg-input p-1">
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
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                      selected
                        ? "bg-bg-card text-text-primary shadow-sm"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                    key={type}
                    onClick={() => updateForm("type", type)}
                    type="button"
                  >
                    <Icon
                      aria-hidden="true"
                      className={selected ? "text-accent" : undefined}
                      size={17}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-text-primary">
              Name <span className="text-accent">*</span>
              <input
                aria-describedby={errors.name ? "vehicle-name-error" : undefined}
                aria-invalid={Boolean(errors.name)}
                autoComplete="off"
                autoFocus
                className={`h-12 rounded-2xl border bg-bg-input px-4 text-base font-medium text-text-primary placeholder:text-text-muted ${
                  errors.name ? "border-red-400" : "border-border-default"
                }`}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="e.g. Night Runner"
                type="text"
                value={form.name}
              />
              {errors.name ? (
                <span className="text-xs font-medium text-red-400" id="vehicle-name-error">
                  {errors.name}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-text-primary">
              Year <span className="font-normal text-text-muted">(optional)</span>
              <input
                className="h-12 rounded-2xl border border-border-default bg-bg-input px-4 text-base font-medium text-text-primary placeholder:text-text-muted"
                inputMode="numeric"
                max={CURRENT_YEAR + 1}
                min="1886"
                onChange={(event) => updateForm("year", event.target.value)}
                placeholder="e.g. 2023"
                type="number"
                value={form.year}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-semibold text-text-primary">
                Tank capacity <span className="text-accent">*</span>
                <div className="relative">
                  <input
                    aria-describedby={
                      errors.tankCapacity ? "tank-capacity-error" : undefined
                    }
                    aria-invalid={Boolean(errors.tankCapacity)}
                    className={`h-12 w-full rounded-2xl border bg-bg-input px-4 pr-9 text-base font-medium text-text-primary placeholder:text-text-muted ${
                      errors.tankCapacity ? "border-red-400" : "border-border-default"
                    }`}
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      updateForm("tankCapacity", event.target.value)
                    }
                    placeholder="10"
                    step="0.1"
                    type="number"
                    value={form.tankCapacity}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                    L
                  </span>
                </div>
                {errors.tankCapacity ? (
                  <span className="text-xs font-medium text-red-400" id="tank-capacity-error">
                    {errors.tankCapacity}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-semibold text-text-primary">
                Reserve <span className="font-normal text-text-muted">(optional)</span>
                <div className="relative">
                  <input
                    className="h-12 w-full rounded-2xl border border-border-default bg-bg-input px-4 pr-9 text-base font-medium text-text-primary placeholder:text-text-muted"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => updateForm("reserve", event.target.value)}
                    placeholder="1.6"
                    step="0.1"
                    type="number"
                    value={form.reserve}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                    L
                  </span>
                </div>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-text-primary">
              Starting odometer
              <div className="relative">
                <input
                  className="h-12 w-full rounded-2xl border border-border-default bg-bg-input px-4 pr-12 text-base font-medium text-text-primary placeholder:text-text-muted"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    updateForm("startingOdometer", event.target.value)
                  }
                  step="1"
                  type="number"
                  value={form.startingOdometer}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                  km
                </span>
              </div>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-text-primary">
              Unit preference
              <div className="relative">
                <select
                  className="h-12 w-full appearance-none rounded-2xl border border-border-default bg-bg-input px-4 pr-10 text-base font-medium text-text-primary"
                  onChange={(event) =>
                    updateForm(
                      "unitPreference",
                      event.target.value as UnitPreferenceChoice,
                    )
                  }
                  value={form.unitPreference}
                >
                  <option value="inherit">
                    App default ({settings.distanceUnit}, {settings.volumeUnit})
                  </option>
                  <option value="metric">Metric (km, L, km/L)</option>
                  <option value="us">US units (mi, gal, mpg)</option>
                  <option value="uk">UK units (mi, gal, mpg)</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={18}
                />
              </div>
            </label>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border-default pt-5">
            <button
              className="h-12 rounded-2xl border border-border-default bg-bg-input text-sm font-semibold text-text-primary transition-colors hover:bg-bg-card"
              onClick={closeVehicleSheet}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-12 rounded-2xl bg-accent text-sm font-bold text-text-primary shadow-accent transition-transform hover:brightness-110 active:scale-[0.98]"
              type="submit"
            >
              Save vehicle
            </button>
          </div>
        </form>
      </BottomSheet>
    </section>
  );
}
