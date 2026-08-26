"use client";

import {
  Bike,
  CarFront,
  Check,
  ChevronDown,
  Fuel,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
import { GarageScreen } from "@/components/garage/GarageScreen";
import { useAppContext } from "@/context/AppContext";
import { useTheme } from "@/lib/theme";
import { calculateRangeBreakdown } from "@/lib/calculations";
import { parseCalendarDate } from "@/lib/date";
import {
  formatDistance,
  formatEconomy,
  formatVolume,
  fromKilometres,
  fromKilometresPerLitre,
  fromLitres,
  resolveUnits,
} from "@/lib/units";

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseCalendarDate(date) ?? new Date(0));
}

function relativeDate(date: string) {
  const parsed = parseCalendarDate(date);
  if (!parsed) {
    return "—";
  }

  const now = new Date();
  const days = Math.max(
    0,
    Math.floor((now.getTime() - parsed.getTime()) / 86_400_000),
  );
  return days === 0 ? "today" : `${days}d ago`;
}

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function trendInsight(economies: number[]) {
  if (economies.length < 2) {
    return null;
  }

  const sampleSize = Math.min(3, Math.floor(economies.length / 2));
  const recent = economies.slice(-sampleSize);
  const previous = economies.slice(-sampleSize * 2, -sampleSize);
  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAverage =
    previous.reduce((sum, value) => sum + value, 0) / previous.length;

  if (!Number.isFinite(previousAverage) || previousAverage <= 0) {
    return null;
  }

  const percentage = ((recentAverage - previousAverage) / previousAverage) * 100;
  return {
    isImprovement: percentage >= 0,
    percentage: Math.abs(percentage),
    previousAverage,
    recentAverage,
  };
}

/** The premium core metrics dashboard for the active vehicle. */
export function DashboardScreen() {
  const {
    activeVehicle,
    getVehicleFillUps,
    isHydrated,
    setActiveVehicle,
    settings,
    vehicles,
  } = useAppContext();
  const { accentTheme } = useTheme();
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState(false);
  const vehicleFillUps = useMemo(
    () => (activeVehicle ? getVehicleFillUps(activeVehicle.id) : []),
    [activeVehicle, getVehicleFillUps],
  );
  const economies = vehicleFillUps
    .map((fillUp) => fillUp.economy)
    .filter((economy): economy is number => economy !== null);
  const averageEconomy =
    economies.length > 0
      ? economies.reduce((sum, economy) => sum + economy, 0) / economies.length
      : null;
  const bestEconomy = economies.length > 0 ? Math.max(...economies) : null;
  const worstEconomy = economies.length > 0 ? Math.min(...economies) : null;
  const trend = trendInsight(economies);
  const units = resolveUnits(settings, activeVehicle);
  const displayAverageEconomy =
    averageEconomy === null
      ? null
      : fromKilometresPerLitre(averageEconomy, units.consumption);
  const range = activeVehicle && averageEconomy
    ? calculateRangeBreakdown(
        activeVehicle.tankCapacity,
        activeVehicle.reserve,
        averageEconomy,
      )
    : null;
  const totalFuel = vehicleFillUps.reduce(
    (total, fillUp) => total + fillUp.fuelAdded,
    0,
  );
  const averageFill =
    vehicleFillUps.length > 0 ? totalFuel / vehicleFillUps.length : null;
  const lastFillUp = vehicleFillUps[vehicleFillUps.length - 1] ?? null;
  const mainTankLitres = activeVehicle
    ? Math.max(activeVehicle.tankCapacity - activeVehicle.reserve, 0)
    : 0;
  const mainRangePercentage = range
    ? (range.mainRange / range.totalRange) * 100
    : activeVehicle && activeVehicle.tankCapacity > 0
      ? (mainTankLitres / activeVehicle.tankCapacity) * 100
      : 0;
  // Gold/amber accents need a reserve fallback so both bar segments stay visible.
  const reserveColor = accentTheme === "gold" ? "#7C8CFF" : "#F5A524";

  if (!isHydrated || vehicles.length === 0 || !activeVehicle) {
    return <GarageScreen variant="dashboard" />;
  }

  const VehicleIcon = activeVehicle.type === "motorcycle" ? Bike : CarFront;
  const displayedRange = range
    ? fromKilometres(range.totalRange, units.distance)
    : null;
  const displayedMainRange = range
    ? fromKilometres(range.mainRange, units.distance)
    : null;
  const displayedReserveRange = range
    ? fromKilometres(range.reserveRange, units.distance)
    : null;

  return (
    <section className="mx-auto min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-[480px] px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-text-primary shadow-accent-glow">
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

      <div className="relative z-40 mt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-bg-card p-4 shadow-[0_10px_30px_rgb(0_0_0_/_0.12)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg-elevated text-text-secondary">
            <VehicleIcon aria-hidden="true" size={20} />
          </span>
          {vehicles.length > 1 ? (
            <button
              aria-expanded={isVehicleMenuOpen}
              className="min-w-0 flex-1 text-left"
              onClick={() => setIsVehicleMenuOpen((open) => !open)}
              type="button"
            >
              <span className="flex items-center gap-1.5 truncate text-base font-bold text-text-primary">
                {activeVehicle.name}
                <ChevronDown aria-hidden="true" className={`shrink-0 text-text-muted transition-transform ${isVehicleMenuOpen ? "rotate-180" : ""}`} size={14} />
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">
                {activeVehicle.year ?? "—"} · {activeVehicle.type}
              </span>
            </button>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate text-base font-bold text-text-primary">{activeVehicle.name}</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">
                {activeVehicle.year ?? "—"} · {activeVehicle.type}
              </span>
            </span>
          )}
          <span className="shrink-0 rounded-xl bg-bg-elevated px-3 py-2 text-right">
            <span className="block text-[9px] font-medium uppercase tracking-[0.08em] text-text-muted">ODO</span>
            <span className="mt-0.5 block font-mono text-sm font-bold tabular-nums text-text-primary">
              {formatDistance(activeVehicle.currentOdometer, units)}
            </span>
          </span>
        </div>

        {isVehicleMenuOpen && vehicles.length > 1 ? (
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border-default bg-bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
            {vehicles.map((vehicle) => {
              const OptionIcon = vehicle.type === "motorcycle" ? Bike : CarFront;
              const optionUnits = resolveUnits(settings, vehicle);
              const selected = vehicle.id === activeVehicle.id;
              return (
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${selected ? "bg-accent/10" : "hover:bg-bg-elevated"}`}
                  key={vehicle.id}
                  onClick={() => {
                    setActiveVehicle(vehicle.id);
                    setIsVehicleMenuOpen(false);
                  }}
                  type="button"
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${selected ? "bg-accent/15 text-accent" : "bg-bg-elevated text-text-secondary"}`}>
                    <OptionIcon aria-hidden="true" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-text-primary">{vehicle.name}</span>
                    <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">{optionUnits.distanceLabel} · {optionUnits.volumeLabel}</span>
                  </span>
                  {selected ? <Check aria-hidden="true" size={17} className="text-accent" strokeWidth={3} /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <article className="relative overflow-hidden rounded-2xl border border-border-default bg-bg-card px-4 py-4 shadow-[0_0_40px_rgb(var(--color-accent)_/_0.06)]">
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgb(var(--color-accent)_/_0.13)_0%,_transparent_68%)]" />
          <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">RIDE</p>

          <div className="mt-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              AVERAGE ECONOMY
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <p className="font-mono text-[52px] font-extrabold leading-none tracking-[-0.07em] tabular-nums text-white">
                {displayAverageEconomy === null ? "—" : formatNumber(displayAverageEconomy)}
              </p>
              <span className="text-xl font-semibold text-accent">{units.economyLabel}</span>
            </div>
            <p className="mt-1.5 text-[13px] text-text-secondary">
              <span className="font-semibold text-success">Best {bestEconomy === null ? "—" : formatEconomy(bestEconomy, units)}</span>
              <span className="mx-2 text-text-muted">•</span>
              <span className="font-semibold text-reserve">Worst {worstEconomy === null ? "—" : formatEconomy(worstEconomy, units)}</span>
            </p>
          </div>

          {trend && economies.length >= 6 ? (
            <div className={`mt-4 flex gap-3 rounded-xl p-3.5 ${trend.isImprovement ? "bg-success/10" : "bg-danger/10"}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${trend.isImprovement ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                {trend.isImprovement ? <TrendingUp aria-hidden="true" size={16} /> : <TrendingDown aria-hidden="true" size={16} />}
              </span>
              <div>
                <p className="text-sm leading-5 text-text-secondary">
                  Your mileage has <span className={trend.isImprovement ? "font-bold text-success" : "font-bold text-danger"}>{trend.isImprovement ? "improved" : "declined"} {formatNumber(trend.percentage)}%</span> over the last 3 fill-ups.
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatEconomy(trend.recentAverage, units)} vs {formatEconomy(trend.previousAverage, units)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 border-t border-border-default pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">FULL TANK RANGE</p>
              <span className="rounded-lg bg-bg-elevated px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-text-secondary">
                {formatVolume(activeVehicle.tankCapacity, units)}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="font-mono text-4xl font-extrabold leading-none tabular-nums text-text-primary">
                {displayedRange === null ? "—" : formatNumber(displayedRange, 0)}
              </p>
              <span className="text-lg font-semibold text-accent">{units.distanceLabel}</span>
            </div>
            <p className="mt-1 text-[13px] text-text-muted">
              {formatVolume(activeVehicle.tankCapacity, units)} × {displayAverageEconomy === null ? "—" : formatNumber(displayAverageEconomy)} {units.economyLabel} average
            </p>

            <div className="mt-4 flex h-3 gap-1 overflow-hidden">
              <span className="rounded-full bg-accent" style={{ width: `${Math.max(mainRangePercentage, 0)}%` }} />
              <span className="min-w-1 flex-1 rounded-full" style={{ backgroundColor: reserveColor }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary"><span className="size-2 rounded-full bg-accent" />Main tank</p>
                <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-text-primary">{displayedMainRange === null ? "—" : formatNumber(displayedMainRange, 0)}<span className="ml-1 text-xs font-medium text-text-muted">{units.distanceLabel}</span></p>
                <p className="mt-1 text-xs text-text-muted">{formatVolume(mainTankLitres, units)}</p>
              </div>
              <div className="rounded-xl bg-bg-elevated p-3">
                <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary"><span className="size-2 rounded-full" style={{ backgroundColor: reserveColor }} />Reserve tank</p>
                <p className="mt-1.5 font-mono text-xl font-bold tabular-nums text-text-primary">{displayedReserveRange === null ? "—" : formatNumber(displayedReserveRange, 0)}<span className="ml-1 text-xs font-medium text-text-muted">{units.distanceLabel}</span></p>
                <p className="mt-1 text-xs text-text-muted">{formatVolume(activeVehicle.reserve, units)}</p>
              </div>
            </div>
          </div>
          </div>
        </article>

        <section className="grid grid-cols-3 rounded-2xl border border-border-default bg-bg-card">
          <article className="px-3 py-3">
            <p className="font-mono text-xl font-bold tabular-nums text-text-primary">{averageFill === null ? "—" : formatVolume(averageFill, units)}</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">AVG FILL</p>
          </article>
          <article className="border-x border-border-default px-3 py-3">
            <p className="font-mono text-xl font-bold tabular-nums text-text-primary">{vehicleFillUps.length === 0 ? "—" : formatVolume(totalFuel, units)}</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">TOTAL FUEL</p>
            <p className="mt-1 text-[10px] text-text-muted">{vehicleFillUps.length} fills</p>
          </article>
          <article className="px-3 py-3">
            <p className="font-mono text-base font-bold tabular-nums text-text-primary">{lastFillUp ? formatDate(lastFillUp.date) : "—"}</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">LAST FILL</p>
            <p className="mt-1 text-[10px] text-text-muted">{lastFillUp ? relativeDate(lastFillUp.date) : "No logs"}</p>
          </article>
        </section>

        <DashboardInsights
          currencySymbol={settings.currencySymbol}
          fillUps={vehicleFillUps}
          settings={settings}
          vehicle={activeVehicle}
        />
      </div>
    </section>
  );
}
