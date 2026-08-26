import { ChevronDown, Fuel, Gauge, MapPin, Pencil, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";

import {
  formatDistance,
  formatEconomy,
  formatVolume,
  fromLitres,
  resolveUnits,
  type ResolvedUnits,
} from "@/lib/units";
import type { AppSettings, FillUp, Vehicle } from "@/lib/types";

interface FillUpCardProps {
  currencySymbol: string;
  fillUp: FillUp;
  settings: AppSettings;
  vehicle?: Vehicle;
  isExpanded: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  vehicleName?: string;
}

function formatNumber(
  value: number,
  maximumFractionDigits = 1,
  minimumFractionDigits = 0,
) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function EconomyMeter({
  economy,
  units,
}: {
  economy: number | null;
  units: ResolvedUnits;
}) {
  if (economy === null) {
    return (
      <div className="mt-4 rounded-xl border border-border-default bg-bg-input px-3 py-2 text-xs font-medium text-text-muted">
        Partial fill — economy will be calculated at the next full tank.
      </div>
    );
  }

  const percentage = Math.min(Math.max(((economy - 15) / 35) * 100, 3), 97);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.1em] text-text-muted">
        <span>ECONOMY</span>
        <span className="text-text-primary">{formatEconomy(economy, units)}</span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400">
        <span
          className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-bg-card bg-text-primary shadow-[0_2px_8px_rgb(0_0_0_/_0.45)]"
          style={{ left: `calc(${percentage}% - 0.375rem)` }}
        />
      </div>
    </div>
  );
}

/** Expandable history entry with summary, economy gauge, and entry actions. */
export function FillUpCard({
  currencySymbol,
  fillUp,
  isExpanded,
  onDelete,
  onEdit,
  onToggle,
  settings,
  vehicle,
  vehicleName,
}: FillUpCardProps) {
  const units = resolveUnits(settings, vehicle);
  const pricePerVolume =
    fillUp.fuelAdded > 0
      ? fillUp.totalCost / fromLitres(fillUp.fuelAdded, units.volume)
      : null;
  const station = fillUp.station || "Fuel stop";

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <article
      className={`rounded-3xl border bg-bg-card p-4 transition-colors ${
        isExpanded ? "border-accent/50" : "border-border-default hover:border-border-default/70"
      }`}
    >
      <div
        aria-expanded={isExpanded}
        aria-label={`Toggle fill-up from ${station}`}
        className="cursor-pointer"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-secondary">
            {formatDate(fillUp.date)}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" size={14} className="shrink-0 text-accent" />
            <h2 className="truncate text-base font-bold tracking-tight text-text-primary">
              {station}
            </h2>
          </div>
          {vehicleName ? (
            <p className="mt-1 truncate text-xs text-text-muted">{vehicleName}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-right text-base font-bold font-mono tabular-nums text-text-primary">
            {currencySymbol}{formatNumber(fillUp.totalCost, 2, 2)}
          </p>
          <ChevronDown
            aria-hidden="true"
            className={`text-text-muted transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            size={18}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border-default bg-bg-input p-3">
        <div>
          <p className="text-[9px] font-bold tracking-[0.12em] text-text-muted">DIST</p>
          <p className="mt-1 text-xs font-bold font-mono tabular-nums text-text-primary">
            {fillUp.distance === null ? "—" : formatDistance(fillUp.distance, units)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[0.12em] text-text-muted">FUEL</p>
          <p className="mt-1 text-xs font-bold font-mono tabular-nums text-text-primary">
            {formatVolume(fillUp.fuelAdded, units)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[0.12em] text-text-muted">
            PRICE/{units.volumeLabel}
          </p>
          <p className="mt-1 text-xs font-bold font-mono tabular-nums text-text-primary">
            {pricePerVolume === null
              ? "—"
              : `${currencySymbol}${formatNumber(pricePerVolume, 2, 2)}`}
          </p>
        </div>
      </div>

        <EconomyMeter economy={fillUp.economy} units={units} />
      </div>

      {isExpanded ? (
        <div className="mt-5 border-t border-border-default pt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-bg-input p-3">
              <p className="text-[9px] font-bold tracking-[0.12em] text-text-muted">ODOMETER</p>
              <p className="mt-1 flex items-center gap-1.5 font-bold font-mono tabular-nums text-text-primary">
                <Gauge aria-hidden="true" size={14} className="text-accent" />
                {formatDistance(fillUp.odometer, units)}
              </p>
            </div>
            <div className="rounded-2xl bg-bg-input p-3">
              <p className="text-[9px] font-bold tracking-[0.12em] text-text-muted">FILL TYPE</p>
              <p className="mt-1 flex items-center gap-1.5 font-bold text-text-primary">
                <Fuel aria-hidden="true" size={14} className="text-accent" />
                {fillUp.isFullTank ? "Full tank" : "Partial"}
              </p>
            </div>
          </div>

          {fillUp.notes ? (
            <p className="mt-3 rounded-2xl border border-border-default bg-bg-input px-3 py-2.5 text-xs leading-5 text-text-secondary">
              {fillUp.notes}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-input text-xs font-bold text-text-primary transition-colors hover:border-accent/40 hover:bg-bg-card"
              onClick={onEdit}
              type="button"
            >
              <Pencil aria-hidden="true" size={15} className="text-accent" />
              Edit
            </button>
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
              onClick={onDelete}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} />
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
