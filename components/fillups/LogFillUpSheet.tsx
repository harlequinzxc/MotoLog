"use client";

import {
  Banknote,
  CalendarDays,
  Fuel,
  Gauge,
  MapPin,
  MessageSquareText,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAppContext } from "@/context/AppContext";
import { calculateFillUpMetrics } from "@/lib/calculations";
import {
  fromKilometres,
  fromLitres,
  resolveUnits,
  toKilometres,
  toLitres,
} from "@/lib/units";
import type { AppSettings, FillUp, Vehicle } from "@/lib/types";

interface LogFillUpSheetProps {
  fillUp?: FillUp;
  onClose: () => void;
  vehicle: Vehicle;
}

interface FillUpFormState {
  date: string;
  fuelAdded: string;
  isFullTank: boolean;
  notes: string;
  odometer: string;
  station: string;
  totalCost: string;
}

type FormErrors = Partial<
  Record<"fuelAdded" | "odometer" | "totalCost", string>
>;

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function numberOrNaN(value: string) {
  if (!value.trim()) {
    return Number.NaN;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function formatInputNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(value);
}

function createInitialForm(
  vehicle: Vehicle,
  settings: AppSettings,
  fillUp?: FillUp,
): FillUpFormState {
  const units = resolveUnits(settings, vehicle);
  const sourceOdometer = fillUp?.odometer ?? vehicle.currentOdometer;
  const sourceFuelAdded = fillUp?.fuelAdded ?? 0;
  const odometer = fromKilometres(sourceOdometer, units.distance);
  const fuelAdded = fromLitres(sourceFuelAdded, units.volume);

  return {
    date: fillUp?.date ?? today(),
    odometer: formatInputNumber(odometer),
    fuelAdded: fillUp ? formatInputNumber(fuelAdded) : "",
    totalCost: fillUp ? formatInputNumber(fillUp.totalCost) : "",
    isFullTank: fillUp?.isFullTank ?? true,
    station: fillUp?.station ?? "",
    notes: fillUp?.notes ?? "",
  };
}

/** Log a new fill-up and preserve correct partial-fill economy calculations. */
export function LogFillUpSheet({
  fillUp,
  onClose,
  vehicle,
}: LogFillUpSheetProps) {
  const { addFillUp, getVehicleFillUps, settings, updateFillUp } = useAppContext();
  const [form, setForm] = useState<FillUpFormState>(() =>
    createInitialForm(vehicle, settings, fillUp),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const units = resolveUnits(settings, vehicle);
  const currentOdometer = fromKilometres(vehicle.currentOdometer, units.distance);
  const distanceUnit = units.distanceLabel;
  const volumeUnit = units.volumeLabel;
  const minimumOdometer = fillUp ? vehicle.startingOdometer : vehicle.currentOdometer;
  const minimumDisplayOdometer = fromKilometres(
    minimumOdometer,
    units.distance,
  );
  const odometerInput = numberOrNaN(form.odometer);
  const odometerDelta = Number.isFinite(odometerInput)
    ? odometerInput - currentOdometer
    : null;

  const updateForm = <Key extends keyof FillUpFormState>(
    key: Key,
    value: FillUpFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "odometer" || key === "fuelAdded" || key === "totalCost") {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const displayOdometer = numberOrNaN(form.odometer);
    const displayFuelAdded = numberOrNaN(form.fuelAdded);
    const totalCost = numberOrNaN(form.totalCost);
    const odometer = toKilometres(displayOdometer, units.distance);
    const fuelAdded = toLitres(displayFuelAdded, units.volume);
    const nextErrors: FormErrors = {};

    if (!Number.isFinite(displayOdometer) || odometer < minimumOdometer) {
      nextErrors.odometer = `Enter at least ${formatNumber(minimumDisplayOdometer)} ${distanceUnit}.`;
    }

    if (!Number.isFinite(displayFuelAdded) || displayFuelAdded <= 0) {
      nextErrors.fuelAdded = "Enter fuel added greater than zero.";
    }

    if (!Number.isFinite(totalCost) || totalCost < 0) {
      nextErrors.totalCost = "Enter a valid total cost.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const metrics = calculateFillUpMetrics({
      existingFillUps: getVehicleFillUps(vehicle.id).filter(
        (existingFillUp) => existingFillUp.id !== fillUp?.id,
      ),
      fuelAdded,
      isFullTank: form.isFullTank,
      odometer,
      vehicle,
    });
    const fillUpValues = {
      date: form.date,
      odometer,
      fuelAdded,
      totalCost,
      isFullTank: form.isFullTank,
      station: form.station,
      notes: form.notes,
      distance: metrics.distance,
      economy: metrics.economy,
    };

    if (fillUp) {
      updateFillUp(fillUp.id, fillUpValues);
    } else {
      addFillUp({ vehicleId: vehicle.id, ...fillUpValues });
    }

    onClose();
  };

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={fillUp ? "Edit fill-up" : "Log a fill-up"}
    >
      <form className="pb-2" noValidate onSubmit={handleSubmit}>
        <div className="mb-6 rounded-2xl border border-accent/15 bg-accent/5 px-4 py-3">
          <p className="text-[10px] font-bold tracking-[0.14em] text-accent">
            LOGGING FOR
          </p>
          <p className="mt-1 text-sm font-bold text-text-primary">{vehicle.name}</p>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
              DATE
            </span>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                size={19}
              />
              <input
                className="h-[3.25rem] w-full rounded-2xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary"
                onChange={(event) => updateForm("date", event.target.value)}
                type="date"
                value={form.date}
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-2 text-[11px] font-bold tracking-[0.12em] text-text-muted">
              <span>CURRENT ODOMETER</span>
              <span className="normal-case tracking-normal">{distanceUnit}</span>
            </span>
            <div className="relative">
              <Gauge
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                size={19}
              />
              <input
                aria-describedby={errors.odometer ? "odometer-error" : "odometer-delta"}
                aria-invalid={Boolean(errors.odometer)}
                className={`h-[3.25rem] w-full rounded-2xl border bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted ${
                  errors.odometer ? "border-red-400" : "border-border-default"
                }`}
                inputMode="decimal"
                min="0"
                onChange={(event) => updateForm("odometer", event.target.value)}
                step="1"
                type="number"
                value={form.odometer}
              />
            </div>
            {errors.odometer ? (
              <span className="text-xs font-medium text-red-400" id="odometer-error">
                {errors.odometer}
              </span>
            ) : odometerDelta === null ? (
              <span className="text-xs text-text-muted" id="odometer-delta">
                Enter the current reading to calculate distance.
              </span>
            ) : odometerDelta < 0 ? (
              <span
                className={`text-xs ${
                  fillUp ? "text-text-secondary" : "font-medium text-red-400"
                }`}
                id="odometer-delta"
              >
                {fillUp
                  ? `${formatNumber(Math.abs(odometerDelta))} ${distanceUnit} before the current reading.`
                  : `${formatNumber(Math.abs(odometerDelta))} ${distanceUnit} below the current reading.`}
              </span>
            ) : odometerDelta === 0 ? (
              <span className="text-xs text-text-muted" id="odometer-delta">
                Matches the current reading.
              </span>
            ) : (
              <span className="text-xs font-medium text-accent" id="odometer-delta">
                +{formatNumber(odometerDelta)} {distanceUnit} since the current reading.
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="flex items-center justify-between gap-1 text-[10px] font-bold tracking-[0.08em] text-text-muted">
                <span>FUEL ADDED</span>
                <span className="normal-case tracking-normal">{volumeUnit}</span>
              </span>
              <div className="relative">
                <Fuel
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  size={18}
                />
                <input
                  aria-describedby={errors.fuelAdded ? "fuel-added-error" : undefined}
                  aria-invalid={Boolean(errors.fuelAdded)}
                  className={`h-[3.25rem] w-full rounded-2xl border bg-bg-input py-3 pl-10 pr-3 text-base font-medium text-text-primary placeholder:text-text-muted ${
                    errors.fuelAdded ? "border-red-400" : "border-border-default"
                  }`}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => updateForm("fuelAdded", event.target.value)}
                  placeholder="5.0"
                  step="0.01"
                  type="number"
                  value={form.fuelAdded}
                />
              </div>
              {errors.fuelAdded ? (
                <span className="text-xs font-medium text-red-400" id="fuel-added-error">
                  {errors.fuelAdded}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="flex items-center justify-between gap-1 text-[10px] font-bold tracking-[0.08em] text-text-muted">
                <span>TOTAL COST</span>
                <span className="normal-case tracking-normal">{settings.currencySymbol}</span>
              </span>
              <div className="relative">
                <Banknote
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                  size={18}
                />
                <input
                  aria-describedby={errors.totalCost ? "total-cost-error" : undefined}
                  aria-invalid={Boolean(errors.totalCost)}
                  className={`h-[3.25rem] w-full rounded-2xl border bg-bg-input py-3 pl-10 pr-3 text-base font-medium text-text-primary placeholder:text-text-muted ${
                    errors.totalCost ? "border-red-400" : "border-border-default"
                  }`}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => updateForm("totalCost", event.target.value)}
                  placeholder="15.00"
                  step="0.01"
                  type="number"
                  value={form.totalCost}
                />
              </div>
              {errors.totalCost ? (
                <span className="text-xs font-medium text-red-400" id="total-cost-error">
                  {errors.totalCost}
                </span>
              ) : null}
            </label>
          </div>

          <button
            aria-pressed={form.isFullTank}
            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
              form.isFullTank
                ? "border-accent/35 bg-accent/10"
                : "border-border-default bg-bg-input"
            }`}
            onClick={() => updateForm("isFullTank", !form.isFullTank)}
            type="button"
          >
            <span>
              <span className="block text-sm font-bold text-text-primary">Full tank?</span>
              <span className="mt-1 block text-xs leading-4 text-text-secondary">
                {form.isFullTank
                  ? "Calculate economy from this fill-up."
                  : "Carry this partial fill forward to the next full tank."}
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                form.isFullTank ? "bg-accent" : "bg-border-default"
              }`}
            >
              <span
                className={`absolute top-1 size-4 rounded-full bg-text-primary shadow-sm transition-transform ${
                  form.isFullTank ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <label className="grid gap-2">
            <span className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
              STATION <span className="normal-case font-normal tracking-normal">(optional)</span>
            </span>
            <div className="relative">
              <MapPin
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                size={19}
              />
              <input
                autoComplete="off"
                className="h-[3.25rem] w-full rounded-2xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted"
                onChange={(event) => updateForm("station", event.target.value)}
                placeholder="e.g. Shell Bukit Timah"
                type="text"
                value={form.station}
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] font-bold tracking-[0.15em] text-text-muted">
              NOTES <span className="normal-case font-normal tracking-normal">(optional)</span>
            </span>
            <div className="relative">
              <MessageSquareText
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-4 text-text-muted"
                size={19}
              />
              <textarea
                className="min-h-24 w-full resize-none rounded-2xl border border-border-default bg-bg-input py-3 pl-12 pr-4 text-base font-medium text-text-primary placeholder:text-text-muted"
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Anything worth remembering?"
                rows={3}
                value={form.notes}
              />
            </div>
          </label>
        </div>

        <div className="mt-8 border-t border-border-default pt-5">
          <button
            className="h-[3.25rem] w-full rounded-2xl bg-accent px-4 text-sm font-bold text-text-primary shadow-accent-glow transition-transform hover:brightness-110 active:scale-[0.98]"
            type="submit"
          >
            {fillUp ? "Save changes" : "Save fill-up"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
