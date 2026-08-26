import {
  Fuel,
  Gauge,
  MapPin,
  Pencil,
  Route,
  Tag,
  Trash2,
} from "lucide-react";
import type { KeyboardEvent } from "react";

import { parseCalendarDate } from "@/lib/date";
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
  averageEconomy: number | null;
  currencySymbol: string;
  fillUp: FillUp;
  isExpanded: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  settings: AppSettings;
  vehicle?: Vehicle;
  vehicleName?: string;
}

function formatNumber(value: number, maximumFractionDigits = 1, minimumFractionDigits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits, minimumFractionDigits }).format(value);
}

function dateParts(date: string) {
  const parsed = parseCalendarDate(date) ?? new Date(0);
  return {
    full: new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(parsed),
    weekday: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(parsed).toUpperCase(),
  };
}

function EconomyIndicator({
  averageEconomy,
  economy,
  units,
}: {
  averageEconomy: number | null;
  economy: number | null;
  units: ResolvedUnits;
}) {
  if (economy === null) {
    return <p className="mt-3 rounded-xl bg-bg-elevated px-3 py-2 text-xs text-text-muted">Partial fill — economy will be calculated at the next full tank.</p>;
  }

  const aboveAverage = averageEconomy === null || economy >= averageEconomy;
  const percentage = Math.min(Math.max(((economy - 15) / 35) * 100, 5), 95);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <span className={`rounded-lg px-2 py-1 font-mono text-xs font-bold tabular-nums ${aboveAverage ? "bg-success/15 text-success" : "bg-accent/15 text-accent"}`}>
          {aboveAverage ? "↗" : "↘"} {formatEconomy(economy, units)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="relative h-2 rounded-full bg-bg-elevated">
            <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-reserve via-text-muted to-success" style={{ width: "100%" }} />
            <span
              className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 bg-text-primary shadow-[0_2px_8px_rgb(0_0_0_/_0.45)] ${aboveAverage ? "border-success" : "border-accent"}`}
              style={{ left: `calc(${percentage}% - 0.375rem)` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-[0.05em] text-text-muted"><span>Worst</span><span>Best</span></div>
        </div>
      </div>
    </div>
  );
}

/** Premium expandable history entry with at-a-glance economy context. */
export function FillUpCard({
  averageEconomy,
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
  const pricePerVolume = fillUp.fuelAdded > 0 ? fillUp.totalCost / fromLitres(fillUp.fuelAdded, units.volume) : null;
  const tripCost = fillUp.distance && fillUp.distance > 0 ? fillUp.totalCost / fillUp.distance : null;
  const station = fillUp.station || "Fuel stop";
  const date = dateParts(fillUp.date);
  const averageDelta = averageEconomy && fillUp.economy ? ((fillUp.economy - averageEconomy) / averageEconomy) * 100 : null;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <article className={`rounded-2xl border bg-bg-card p-4 transition-colors ${isExpanded ? "border-accent/50" : "border-border-default"}`}>
      <div aria-expanded={isExpanded} aria-label={`Toggle fill-up from ${station}`} className="cursor-pointer" onClick={onToggle} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
        <div className="flex gap-3">
          <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <span className="text-[10px] font-bold uppercase tracking-[0.04em]">{date.weekday}</span>
            <Fuel aria-hidden="true" size={16} className="mt-0.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-bold text-text-primary">{date.full}</h2>
                <p className="mt-1 truncate text-[13px] italic text-text-muted">{station}{fillUp.notes ? ` · ${fillUp.notes}` : ""}</p>
                {vehicleName ? <p className="mt-1 text-[11px] text-text-muted">{vehicleName}</p> : null}
              </div>
              <p className="shrink-0 font-mono text-lg font-bold tabular-nums text-text-primary">{currencySymbol}{formatNumber(fillUp.totalCost, 2, 2)}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
              <span className="flex items-center gap-1"><Route aria-hidden="true" size={12} />{fillUp.distance === null ? "—" : formatDistance(fillUp.distance, units)}</span>
              <span className="text-text-muted">•</span>
              <span className="flex items-center gap-1"><Fuel aria-hidden="true" size={12} />{formatVolume(fillUp.fuelAdded, units)}</span>
              <span className="text-text-muted">•</span>
              <span className="flex items-center gap-1"><Tag aria-hidden="true" size={12} />{pricePerVolume === null ? "—" : `${currencySymbol}${formatNumber(pricePerVolume, 2, 2)}/${units.volumeLabel}`}</span>
            </div>
          </div>
        </div>
        <EconomyIndicator averageEconomy={averageEconomy} economy={fillUp.economy} units={units} />
      </div>

      {isExpanded ? (
        <div className="mt-4 border-t border-border-default pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">ODOMETER</p><p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-text-primary"><Gauge aria-hidden="true" size={14} className="text-accent" />{formatDistance(fillUp.odometer, units)}</p></div>
            <div><p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">TRIP COST</p><p className="mt-1 font-mono text-sm font-bold tabular-nums text-text-primary">{tripCost === null ? "—" : `${currencySymbol}${formatNumber(tripCost, 3)}/${units.distanceLabel}`}</p></div>
            <div><p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">TANK</p><p className="mt-1 text-sm font-bold text-text-primary">{fillUp.isFullTank ? "Full fill" : "Partial fill"}</p></div>
            <div><p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">VS AVERAGE</p><p className={`mt-1 font-mono text-sm font-bold tabular-nums ${averageDelta === null ? "text-text-primary" : averageDelta >= 0 ? "text-success" : "text-accent"}`}>{averageDelta === null ? "—" : `${averageDelta >= 0 ? "+" : ""}${formatNumber(averageDelta)}%`}</p></div>
          </div>
          <div className="mt-4 flex justify-end gap-5">
            <button className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary" onClick={onEdit} type="button"><Pencil aria-hidden="true" size={14} />Edit</button>
            <button className="flex items-center gap-1.5 text-[13px] font-medium text-accent hover:brightness-125" onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
