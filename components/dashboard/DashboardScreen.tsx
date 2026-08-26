"use client";

import {
  Bike,
  CalendarDays,
  CarFront,
  ChevronDown,
  Fuel,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

import { MotoMark } from "@/components/branding/MotoMark";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
import { GarageScreen } from "@/components/garage/GarageScreen";
import { useAppContext } from "@/context/AppContext";
import { calculateRangeBreakdown } from "@/lib/calculations";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import {
  formatDistance,
  formatEconomy,
  formatVolume,
  fromKilometresPerLitre,
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
  }).format(new Date(`${date}T12:00:00`));
}

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
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
  };
}

/** The core metrics dashboard for the active vehicle. */
export function DashboardScreen() {
  const {
    activeVehicle,
    getVehicleFillUps,
    isHydrated,
    setActiveVehicle,
    settings,
    vehicles,
  } = useAppContext();
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

  // The empty Dashboard deliberately reuses the Garage first-run experience.
  if (!isHydrated || vehicles.length === 0 || !activeVehicle) {
    return <GarageScreen />;
  }

  const VehicleIcon = activeVehicle.type === "motorcycle" ? Bike : CarFront;

  return (
    <section className="mx-auto min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-lg px-5 pb-8 pt-[max(1.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MotoMark size={31} />
          <div>
            <span className="text-sm font-bold tracking-tight text-text-primary">
              {APP_NAME}
            </span>
            <p className="mt-0.5 text-[11px] text-text-muted">{todayLabel()}</p>
          </div>
        </div>
        <span className="rounded-full border border-border-default bg-bg-card px-3 py-1 text-xs font-medium text-text-secondary">
          {APP_VERSION}
        </span>
      </header>

      <label className="mt-6 flex h-14 items-center gap-3 rounded-2xl border border-border-default bg-bg-card px-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <VehicleIcon aria-hidden="true" size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-[0.12em] text-text-muted">
            ACTIVE VEHICLE
          </span>
          <span className="block truncate text-sm font-bold text-text-primary">
            {activeVehicle.name}
          </span>
        </span>
        <span className="relative shrink-0">
          <select
            aria-label="Select active vehicle"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => setActiveVehicle(event.target.value)}
            value={activeVehicle.id}
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="text-text-muted" size={18} />
        </span>
      </label>

      <div className="mt-5 grid gap-4">
        <article className="overflow-hidden rounded-3xl border border-border-default bg-bg-card p-5 shadow-[0_18px_48px_rgb(0_0_0_/_0.16)]">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent">RIDE</p>
            {trend ? (
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  trend.isImprovement
                    ? "bg-accent/10 text-accent"
                    : "bg-red-500/10 text-red-300"
                }`}
              >
                {trend.isImprovement ? (
                  <TrendingUp aria-hidden="true" size={13} />
                ) : (
                  <TrendingDown aria-hidden="true" size={13} />
                )}
                {trend.isImprovement ? "improved" : "down"} {formatNumber(trend.percentage)}%
              </span>
            ) : (
              <span className="rounded-full bg-bg-input px-2.5 py-1 text-[10px] font-bold text-text-muted">
                BUILDING TREND
              </span>
            )}
          </div>

          <div className="mt-5 flex items-end gap-2">
            <p className="text-5xl font-bold leading-none tracking-[-0.06em] font-mono tabular-nums text-text-primary">
              {displayAverageEconomy === null ? "—" : formatNumber(displayAverageEconomy)}
            </p>
            <p className="pb-1 text-sm font-bold text-text-secondary">
              {units.economyLabel} avg
            </p>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {averageEconomy === null
              ? "Log a full tank to unlock your ride economy."
              : `${economies.length} full-tank ${economies.length === 1 ? "reading" : "readings"} recorded.`}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-text-muted">BEST</p>
              <p className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
                {bestEconomy === null ? "—" : formatEconomy(bestEconomy, units)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-text-muted">WORST</p>
              <p className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
                {worstEconomy === null ? "—" : formatEconomy(worstEconomy, units)}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-border-default bg-bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-accent">
                FULL TANK RANGE
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight font-mono tabular-nums text-text-primary">
                {range ? `~${formatDistance(range.totalRange, units)}` : "—"}
              </p>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Gauge aria-hidden="true" size={22} />
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-muted">
            {range
              ? "Estimated from your average full-tank economy."
              : "Add a full-tank log to estimate your range."}
          </p>

          <div className="mt-5 overflow-hidden rounded-full bg-bg-input p-1">
            <div className="flex h-3 overflow-hidden rounded-full">
              <span
                className="bg-accent"
                style={{ width: `${Math.max(mainRangePercentage, 0)}%` }}
              />
              <span className="flex-1 bg-text-muted/45" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-bold text-text-primary">
                Main · {formatVolume(mainTankLitres, units)}
              </p>
              <p className="mt-1 text-text-muted">
                {range ? `~${formatDistance(range.mainRange, units)}` : "Range pending"}
              </p>
            </div>
            <div className="border-l border-border-default pl-3">
              <p className="font-bold text-text-primary">
                Reserve · {formatVolume(activeVehicle.reserve, units)}
              </p>
              <p className="mt-1 text-text-muted">
                {range ? `~${formatDistance(range.reserveRange, units)}` : "Range pending"}
              </p>
            </div>
          </div>
        </article>

        <section>
          <p className="mb-3 px-1 text-[11px] font-bold tracking-[0.16em] text-text-muted">
            QUICK STATS
          </p>
          <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-border-default bg-bg-card">
            <div className="border-r border-border-default px-3 py-4">
              <Fuel aria-hidden="true" size={16} className="text-accent" />
              <p className="mt-3 text-[9px] font-bold tracking-[0.12em] text-text-muted">
                AVG FILL
              </p>
              <p className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
                {averageFill === null ? "—" : formatVolume(averageFill, units)}
              </p>
            </div>
            <div className="border-r border-border-default px-3 py-4">
              <Fuel aria-hidden="true" size={16} className="text-accent" />
              <p className="mt-3 text-[9px] font-bold tracking-[0.12em] text-text-muted">
                TOTAL FUEL
              </p>
              <p className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
                {vehicleFillUps.length === 0 ? "—" : formatVolume(totalFuel, units)}
              </p>
            </div>
            <div className="px-3 py-4">
              <CalendarDays aria-hidden="true" size={16} className="text-accent" />
              <p className="mt-3 text-[9px] font-bold tracking-[0.12em] text-text-muted">
                LAST FILL
              </p>
              <p className="mt-1 text-xs font-bold leading-4 text-text-primary">
                {lastFillUp ? formatDate(lastFillUp.date) : "—"}
              </p>
            </div>
          </div>
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
