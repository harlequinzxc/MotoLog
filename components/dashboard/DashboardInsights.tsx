"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { parseCalendarDate } from "@/lib/date";
import {
  fromKilometres,
  fromKilometresPerLitre,
  fromLitres,
  resolveUnits,
} from "@/lib/units";
import type { AppSettings, FillUp, Vehicle } from "@/lib/types";

interface DashboardInsightsProps {
  currencySymbol: string;
  fillUps: FillUp[];
  settings: AppSettings;
  vehicle: Vehicle;
}

interface MonthlySpend {
  isCurrent: boolean;
  key: string;
  label: string;
  spend: number;
}

function toDate(date: string) {
  return parseCalendarDate(date) ?? new Date(0);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function fillUpMonthKey(fillUp: FillUp) {
  return fillUp.date.slice(0, 7);
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function formatCurrency(currencySymbol: string, value: number) {
  return `${currencySymbol}${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function sixMonthSpending(fillUps: FillUp[]): MonthlySpend[] {
  const now = new Date();
  const currentMonthKey = monthKey(now);

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(monthDate);
    const spend = fillUps
      .filter((fillUp) => fillUpMonthKey(fillUp) === key)
      .reduce((total, fillUp) => total + fillUp.totalCost, 0);

    return {
      key,
      spend,
      isCurrent: key === currentMonthKey,
      label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(monthDate),
    };
  });
}

function ChartTooltip({
  active,
  currencySymbol,
  label,
  payload,
  suffix,
}: {
  active?: boolean;
  currencySymbol?: string;
  label?: string;
  payload?: Array<{ value?: number | string }>;
  suffix?: string;
}) {
  if (!active || !payload?.[0] || payload[0].value === undefined) {
    return null;
  }

  const value = Number(payload[0].value);
  const formattedValue = currencySymbol
    ? formatCurrency(currencySymbol, value)
    : `${formatNumber(value)}${suffix ?? ""}`;

  return (
    <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-xs shadow-[0_10px_28px_rgb(0_0_0_/_0.3)]">
      <p className="text-text-muted">{label}</p>
      <p className="mt-1 font-bold text-text-primary">{formattedValue}</p>
    </div>
  );
}

/** Costs and six-month trend charts for the active vehicle. */
export function DashboardInsights({
  currencySymbol,
  fillUps,
  settings,
  vehicle,
}: DashboardInsightsProps) {
  const units = resolveUnits(settings, vehicle);
  const now = new Date();
  const currentMonth = monthKey(now);
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentMonthSpend = fillUps
    .filter((fillUp) => fillUpMonthKey(fillUp) === currentMonth)
    .reduce((total, fillUp) => total + fillUp.totalCost, 0);
  const previousMonthSpend = fillUps
    .filter((fillUp) => fillUpMonthKey(fillUp) === previousMonth)
    .reduce((total, fillUp) => total + fillUp.totalCost, 0);
  const distanceTotal = fillUps.reduce(
    (total, fillUp) => total + (fillUp.distance ?? 0),
    0,
  );
  const totalCost = fillUps.reduce((total, fillUp) => total + fillUp.totalCost, 0);
  const totalFuel = fillUps.reduce((total, fillUp) => total + fillUp.fuelAdded, 0);
  const displayDistanceTotal = fromKilometres(distanceTotal, units.distance);
  const displayFuelTotal = fromLitres(totalFuel, units.volume);
  const costPerDistance =
    displayDistanceTotal > 0 ? totalCost / displayDistanceTotal : null;
  const averageFuelPrice = displayFuelTotal > 0 ? totalCost / displayFuelTotal : null;
  const spending = sixMonthSpending(fillUps);
  const economyTrend = fillUps
    .filter((fillUp) => fillUp.economy !== null)
    .sort(
      (first, second) =>
        first.date.localeCompare(second.date) || first.odometer - second.odometer,
    )
    .map((fillUp) => ({
      date: new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
      }).format(toDate(fillUp.date)),
      economy: fromKilometresPerLitre(
        fillUp.economy as number,
        units.consumption,
      ) as number,
    }));
  const averageEconomy =
    economyTrend.length > 0
      ? economyTrend.reduce((sum, entry) => sum + entry.economy, 0) /
        economyTrend.length
      : null;
  const monthDifference = previousMonthSpend > 0
    ? ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100
    : null;

  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-border-default bg-bg-card p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent">COSTS</p>
            <p className="mt-2 text-3xl font-bold tracking-tight font-mono tabular-nums text-text-primary">
              {formatCurrency(currencySymbol, currentMonthSpend)}
            </p>
            <p className="mt-1 text-xs text-text-muted">Spent this month</p>
          </div>
          <div className="rounded-2xl border border-border-default bg-bg-input px-3 py-2 text-right">
            <p className="text-[9px] font-bold tracking-[0.12em] text-text-muted">LAST MONTH</p>
            <p className="mt-1 text-xs font-bold font-mono tabular-nums text-text-primary">
              {formatCurrency(currencySymbol, previousMonthSpend)}
            </p>
            <p className={`mt-1 text-[10px] font-bold ${
              monthDifference === null || monthDifference <= 0 ? "text-accent" : "text-red-300"
            }`}>
              {monthDifference === null
                ? "No prior data"
                : `${monthDifference > 0 ? "+" : ""}${formatNumber(monthDifference)}%`}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-text-muted">
              COST / {units.distanceLabel.toUpperCase()}
            </p>
            <p className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
              {costPerDistance === null
                ? "—"
                : `${formatCurrency(currencySymbol, costPerDistance)}/${units.distanceLabel}`}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-text-muted">AVG FUEL PRICE</p>
            <p className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
              {averageFuelPrice === null
                ? "—"
                : `${formatCurrency(currencySymbol, averageFuelPrice)}/${units.volumeLabel}`}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border-default bg-bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent">TRENDS</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-text-primary">
              Economy over time
            </h2>
          </div>
          {averageEconomy !== null ? (
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent">
              AVG {formatNumber(averageEconomy)} {units.economyLabel}
            </span>
          ) : null}
        </div>

        {economyTrend.length > 0 ? (
          <div className="mt-5 h-52" role="img" aria-label="Economy trend chart">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={economyTrend} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="economy-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2A30" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  minTickGap={22}
                  tick={{ fill: "#6B6B74", fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#6B6B74", fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  content={<ChartTooltip suffix={` ${units.economyLabel}`} />}
                  cursor={{ stroke: "#6B6B74", strokeDasharray: "3 3" }}
                />
                {averageEconomy !== null ? (
                  <ReferenceLine
                    label={{ fill: "#A0A0A8", fontSize: 10, position: "insideTopRight", value: "avg" }}
                    stroke="#A0A0A8"
                    strokeDasharray="5 5"
                    y={averageEconomy}
                  />
                ) : null}
                <Area
                  dataKey="economy"
                  fill="url(#economy-area)"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-5 flex h-52 items-center justify-center rounded-2xl border border-dashed border-border-default bg-bg-input px-6 text-center text-sm leading-6 text-text-muted">
            Log a full tank to reveal your economy trend.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border-default bg-bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent">TRENDS</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-text-primary">
              Monthly spending
            </h2>
          </div>
          <span className="text-xs text-text-muted">Past 6 months</span>
        </div>

        <div className="mt-5 h-52" role="img" aria-label="Monthly spending chart">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={spending} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#2A2A30" strokeDasharray="3 5" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                tick={{ fill: "#6B6B74", fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "#6B6B74", fontSize: 10 }}
                tickFormatter={(value) => `${currencySymbol}${value}`}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip currencySymbol={currencySymbol} />}
                cursor={{ fill: "rgb(255 255 255 / 0.03)" }}
              />
              <Bar dataKey="spend" radius={[7, 7, 2, 2]}>
                {spending.map((entry) => (
                  <Cell
                    fill={entry.isCurrent ? "var(--accent)" : "#3A3A42"}
                    key={entry.key}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
