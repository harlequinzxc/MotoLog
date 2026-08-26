"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Droplet, Fuel, Route, Wallet } from "lucide-react";

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
    <div className="grid gap-6">
      <section>
        <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">COSTS</p>
        <article className="rounded-2xl border border-border-default bg-bg-card p-5">
          <div className="flex items-center gap-2 text-text-muted">
            <Wallet aria-hidden="true" size={17} />
            <p className="text-[10px] font-medium uppercase tracking-[0.08em]">SPENT THIS MONTH</p>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <p className="font-mono text-[32px] font-bold tracking-tight tabular-nums text-text-primary">
              {formatCurrency(currencySymbol, currentMonthSpend)}
            </p>
            {monthDifference !== null ? (
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                monthDifference <= 0 ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
              }`}>
                {monthDifference <= 0 ? "↘" : "↗"} {formatNumber(Math.abs(monthDifference))}%
              </span>
            ) : null}
            <span className="text-xs text-text-muted">vs last month</span>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {formatCurrency(currencySymbol, totalCost)} lifetime · {formatCurrency(currencySymbol, previousMonthSpend)} last month
          </p>
        </article>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-border-default bg-bg-card p-4">
            <div className="flex items-center gap-2 text-text-muted"><Route aria-hidden="true" size={16} /><p className="text-[10px] font-medium uppercase tracking-[0.06em]">COST / {units.distanceLabel}</p></div>
            <p className="mt-3 font-mono text-[26px] font-bold tabular-nums text-text-primary">
              {costPerDistance === null ? "—" : formatCurrency(currencySymbol, costPerDistance)}
            </p>
          </article>
          <article className="rounded-2xl border border-border-default bg-bg-card p-4">
            <div className="flex items-center gap-2 text-text-muted"><Droplet aria-hidden="true" size={16} /><p className="text-[10px] font-medium uppercase tracking-[0.06em]">FUEL PRICE</p></div>
            <p className="mt-3 font-mono text-[26px] font-bold tabular-nums text-text-primary">
              {averageFuelPrice === null ? "—" : formatCurrency(currencySymbol, averageFuelPrice)}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">avg per {units.volumeLabel}</p>
          </article>
        </div>
      </section>

      <section>
        <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">TRENDS</p>
        <article className="rounded-2xl border border-border-default bg-bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Fuel aria-hidden="true" size={17} className="text-accent" /><h2 className="text-sm font-bold uppercase tracking-[0.05em] text-text-primary">ECONOMY TREND</h2></div>
            <span className="text-xs text-text-muted">{economyTrend.length} readings</span>
          </div>

          {economyTrend.length > 0 ? (
            <>
              <div className="mt-5 h-[200px]" role="img" aria-label="Economy trend chart">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={economyTrend} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="economy-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgb(160 160 168 / 0.15)" strokeDasharray="3 5" vertical={false} />
                    <XAxis axisLine={false} dataKey="date" interval="preserveStartEnd" tick={{ fill: "#6B6B74", fontSize: 10 }} tickLine={false} />
                    <YAxis axisLine={false} tick={{ fill: "#6B6B74", fontSize: 10 }} tickCount={3} tickLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip content={<ChartTooltip suffix={` ${units.economyLabel}`} />} cursor={{ stroke: "#6B6B74", strokeDasharray: "3 3" }} />
                    {averageEconomy !== null ? (
                      <ReferenceLine
                        label={{ fill: "#84CC16", fontSize: 11, fontWeight: 700, position: "insideTopRight", value: `AVG ${formatNumber(averageEconomy)}` }}
                        stroke="#84CC16"
                        strokeDasharray="3 3"
                        y={averageEconomy}
                      />
                    ) : null}
                    <Area activeDot={{ r: 6, fill: "var(--accent)", stroke: "#1A1A1E", strokeWidth: 2 }} dataKey="economy" dot={{ r: 3, fill: "#1A1A1E", stroke: "var(--accent)", strokeWidth: 2 }} fill="url(#economy-area)" stroke="var(--accent)" strokeWidth={2.5} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">{units.economyLabel} PER FULL-TANK FILL</p>
            </>
          ) : (
            <div className="mt-5 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-border-default bg-bg-elevated px-6 text-center text-sm leading-6 text-text-muted">Log a full tank to reveal your economy trend.</div>
          )}
        </article>
      </section>

      <section>
        <article className="rounded-2xl border border-border-default bg-bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Wallet aria-hidden="true" size={17} className="text-accent" /><h2 className="text-sm font-bold uppercase tracking-[0.05em] text-text-primary">SPENDING</h2></div>
            <span className="text-xs text-text-muted">Past 6 months</span>
          </div>
          <div className="mt-5 h-[200px]" role="img" aria-label="Monthly spending chart">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={spending} margin={{ top: 24, right: 4, left: 0, bottom: 0 }}>
                <XAxis axisLine={false} dataKey="label" tick={{ fill: "#6B6B74", fontSize: 10 }} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip currencySymbol={currencySymbol} />} cursor={{ fill: "rgb(255 255 255 / 0.03)" }} />
                <Bar dataKey="spend" radius={[8, 8, 2, 2]}>
                  <LabelList dataKey="spend" fill="#A0A0A8" fontSize={10} formatter={(value) => formatCurrency(currencySymbol, Number(value))} position="top" />
                  {spending.map((entry) => (
                    <Cell fill={entry.isCurrent ? "var(--accent)" : "#3A3A42"} key={entry.key} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">MONTHLY FUEL SPEND</p>
        </article>
      </section>
    </div>
  );
}
