"use client";

import { ChevronDown, History, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { LogFillUpSheet } from "@/components/fillups/LogFillUpSheet";
import { FillUpCard } from "@/components/history/FillUpCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppContext } from "@/context/AppContext";
import { parseCalendarDate } from "@/lib/date";
import { formatEconomy, resolveUnits } from "@/lib/units";
import type { FillUp } from "@/lib/types";

type FillTypeFilter = "all" | "full" | "partial";
type SortOption = "best-economy" | "highest-cost" | "newest" | "oldest";
type TimePeriod = "30-days" | "90-days" | "all" | "this-year";

function toDate(date: string) {
  return parseCalendarDate(date) ?? new Date(0);
}

function monthKey(fillUp: FillUp) {
  const date = toDate(fillUp.date);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function isInPeriod(fillUp: FillUp, period: TimePeriod) {
  if (period === "all") {
    return true;
  }

  const now = new Date();
  const loggedAt = toDate(fillUp.date);

  if (period === "this-year") {
    return loggedAt.getFullYear() === now.getFullYear();
  }

  const days = period === "30-days" ? 30 : 90;
  const earliest = new Date(now);
  earliest.setDate(earliest.getDate() - days);
  earliest.setHours(0, 0, 0, 0);
  return loggedAt >= earliest;
}

function sortFillUps(fillUps: FillUp[], sort: SortOption) {
  return [...fillUps].sort((first, second) => {
    switch (sort) {
      case "oldest":
        return (
          first.date.localeCompare(second.date) || first.odometer - second.odometer
        );
      case "highest-cost":
        return (
          second.totalCost - first.totalCost ||
          second.date.localeCompare(first.date)
        );
      case "best-economy":
        return (
          (second.economy ?? Number.NEGATIVE_INFINITY) -
            (first.economy ?? Number.NEGATIVE_INFINITY) ||
          second.date.localeCompare(first.date)
        );
      default:
        return (
          second.date.localeCompare(first.date) || second.odometer - first.odometer
        );
    }
  });
}

/** Searchable, filterable, month-grouped fill-up history. */
export function HistoryScreen() {
  const { deleteFillUp, fillUps, isHydrated, settings, vehicles } =
    useAppContext();
  const [search, setSearch] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [fillType, setFillType] = useState<FillTypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [expandedFillUpId, setExpandedFillUpId] = useState<string | null>(null);
  const [editingFillUpId, setEditingFillUpId] = useState<string | null>(null);
  const [fillUpPendingDelete, setFillUpPendingDelete] = useState<FillUp | null>(
    null,
  );

  const vehicleNames = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.name])),
    [vehicles],
  );
  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles],
  );
  const globalUnits = resolveUnits(settings);
  const filteredFillUps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return sortFillUps(
      fillUps.filter((fillUp) => {
        const matchesSearch =
          !query ||
          fillUp.station.toLocaleLowerCase().includes(query) ||
          fillUp.notes.toLocaleLowerCase().includes(query) ||
          vehicleNames.get(fillUp.vehicleId)?.toLocaleLowerCase().includes(query);
        const matchesType =
          fillType === "all" ||
          (fillType === "full" ? fillUp.isFullTank : !fillUp.isFullTank);

        return matchesSearch && matchesType && isInPeriod(fillUp, timePeriod);
      }),
      sort,
    );
  }, [fillType, fillUps, search, sort, timePeriod, vehicleNames]);
  const groupedFillUps = useMemo(() => {
    const groups = new Map<string, FillUp[]>();

    filteredFillUps.forEach((fillUp) => {
      const key = monthKey(fillUp);
      const current = groups.get(key) ?? [];
      current.push(fillUp);
      groups.set(key, current);
    });

    return [...groups.entries()].sort(([first], [second]) =>
      sort === "oldest" ? first.localeCompare(second) : second.localeCompare(first),
    );
  }, [filteredFillUps, sort]);
  const economyValues = filteredFillUps
    .map((fillUp) => fillUp.economy)
    .filter((economy): economy is number => economy !== null);
  const averageEconomy =
    economyValues.length > 0
      ? economyValues.reduce((sum, economy) => sum + economy, 0) /
        economyValues.length
      : null;
  const bestEconomy = economyValues.length > 0 ? Math.max(...economyValues) : null;
  const worstEconomy = economyValues.length > 0 ? Math.min(...economyValues) : null;
  const editingFillUp =
    fillUps.find((fillUp) => fillUp.id === editingFillUpId) ?? null;
  const editingVehicle = editingFillUp
    ? vehicles.find((vehicle) => vehicle.id === editingFillUp.vehicleId) ?? null
    : null;

  const confirmFillUpDelete = () => {
    if (!fillUpPendingDelete) {
      return;
    }

    deleteFillUp(fillUpPendingDelete.id);
    setFillUpPendingDelete(null);
    setExpandedFillUpId((current) =>
      current === fillUpPendingDelete.id ? null : current,
    );
  };

  return (
    <section className="mx-auto min-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-[480px] pb-8">
      <div className="sticky top-0 z-30 border-b border-border-default bg-bg-base/90 px-5 pb-5 pt-[max(1.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <header>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">EVERY DROP, ACCOUNTED</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
            History <span className="align-baseline text-lg font-medium text-text-muted">{fillUps.length}</span>
          </h1>
        </header>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["AVG", averageEconomy, "text-text-primary"],
            ["BEST", bestEconomy, "text-success"],
            ["WORST", worstEconomy, "text-accent"],
          ].map(([label, value, color]) => (
            <div className="rounded-xl bg-bg-card px-3 py-3" key={label as string}>
              <p className={`font-mono text-[22px] font-bold tabular-nums ${color}`}>
                {value === null ? "—" : formatEconomy(value as number, globalUnits).split(" ")[0]}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">
                {label} {globalUnits.economyLabel}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-text-muted">
          <span><span className="mr-1 text-success">●</span>above avg</span>
          <span><span className="mr-1 text-text-muted">●</span>near</span>
          <span><span className="mr-1 text-accent">●</span>below</span>
        </div>

        <label className="relative mt-4 block">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            className="h-14 w-full rounded-2xl border border-border-default bg-bg-card py-3 pl-12 pr-4 text-[15px] font-medium text-text-primary placeholder:text-text-muted"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search station, notes or cost..."
            type="search"
            value={search}
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            aria-label="Time period"
            className="h-9 rounded-full border border-border-default bg-bg-card px-3 text-[13px] font-medium text-text-secondary"
            onChange={(event) => setTimePeriod(event.target.value as TimePeriod)}
            value={timePeriod}
          >
            <option value="all">All time</option>
            <option value="30-days">Last 30 days</option>
            <option value="90-days">Last 90 days</option>
            <option value="this-year">{new Date().getFullYear()}</option>
          </select>
          {([['all', 'All'], ['full', 'Full'], ['partial', 'Partial']] as const).map(([type, label]) => (
            <button
              className={`h-9 rounded-full px-4 text-[13px] font-medium ${fillType === type ? "bg-accent text-text-primary shadow-accent-glow" : "bg-bg-card text-text-muted"}`}
              key={type}
              onClick={() => setFillType(type)}
              type="button"
            >
              {label}
            </button>
          ))}
          <span className="ml-auto relative">
            <select
              aria-label="Sort history"
              className="h-9 appearance-none rounded-full border border-border-default bg-bg-card py-0 pl-3 pr-8 text-[13px] font-medium text-text-secondary"
              onChange={(event) => setSort(event.target.value as SortOption)}
              value={sort}
            >
              <option value="newest">↓ Newest</option>
              <option value="oldest">↑ Oldest</option>
              <option value="best-economy">Best efficiency</option>
              <option value="highest-cost">Highest cost</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          </span>
        </div>
      </div>

      <div className="px-5 py-6">
        {!isHydrated ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((index) => (
              <div className="h-40 animate-pulse rounded-3xl bg-bg-card" key={index} />
            ))}
          </div>
        ) : fillUps.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-border-default bg-bg-card px-6 text-center">
            <span className="grid size-14 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent shadow-accent-glow">
              <History aria-hidden="true" size={27} />
            </span>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-text-primary">
              No fill-ups recorded yet
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">
              Your logged fuel stops will be grouped here as your history grows.
            </p>
          </div>
        ) : filteredFillUps.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-border-default bg-bg-card px-6 text-center">
            <Search aria-hidden="true" size={26} className="text-accent" />
            <h2 className="mt-4 text-lg font-bold text-text-primary">No matching fill-ups</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Try broadening the search or changing a filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-7">
            {groupedFillUps.map(([key, monthFillUps]) => (
              <section key={key}>
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold uppercase tracking-[0.04em] text-text-secondary">{monthLabel(key)}</h2>
                  <span className="text-xs text-text-muted">
                    {monthFillUps.length} {monthFillUps.length === 1 ? "log" : "logs"} · {settings.currencySymbol}{monthFillUps.reduce((total, fillUp) => total + fillUp.totalCost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="grid gap-3">
                  {monthFillUps.map((fillUp) => (
                    <FillUpCard
                      averageEconomy={averageEconomy}
                      currencySymbol={settings.currencySymbol}
                      fillUp={fillUp}
                      isExpanded={expandedFillUpId === fillUp.id}
                      key={fillUp.id}
                      onDelete={() => setFillUpPendingDelete(fillUp)}
                      onEdit={() => {
                        setEditingFillUpId(fillUp.id);
                        setExpandedFillUpId(null);
                      }}
                      onToggle={() =>
                        setExpandedFillUpId((current) =>
                          current === fillUp.id ? null : fillUp.id,
                        )
                      }
                      settings={settings}
                      vehicle={vehiclesById.get(fillUp.vehicleId)}
                      vehicleName={vehicleNames.get(fillUp.vehicleId)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {editingFillUp && editingVehicle ? (
        <LogFillUpSheet
          fillUp={editingFillUp}
          key={editingFillUp.id}
          onClose={() => setEditingFillUpId(null)}
          vehicle={editingVehicle}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete fill-up"
        description={
          fillUpPendingDelete
            ? `This removes the ${fillUpPendingDelete.station || "fuel"} log from ${fillUpPendingDelete.date}. This cannot be undone.`
            : ""
        }
        isOpen={Boolean(fillUpPendingDelete)}
        onCancel={() => setFillUpPendingDelete(null)}
        onConfirm={confirmFillUpDelete}
        title="Delete fill-up?"
      />
    </section>
  );
}
