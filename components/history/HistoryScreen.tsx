"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, History, LoaderCircle, Search } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type UIEvent,
} from "react";

import { LogFillUpSheet } from "@/components/fillups/LogFillUpSheet";
import { FillUpCard } from "@/components/history/FillUpCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  type SelectedVehicleId,
  useAppContext,
} from "@/context/AppContext";
import { parseCalendarDate } from "@/lib/date";
import { queryHistoryCursorPage, HISTORY_PAGE_SIZE } from "@/lib/historyCursor";
import { formatEconomy, resolveUnits } from "@/lib/units";
import type { FillUp } from "@/lib/types";

type FillTypeFilter = "all" | "full" | "partial";
type SortOption = "best-economy" | "highest-cost" | "newest" | "oldest";
type TimePeriod = "30-days" | "90-days" | "all" | "this-year";

type HistoryRow =
  | { key: string; label: string; spend: number; type: "month" }
  | { fillUp: FillUp; key: string; type: "fill" };

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
        return first.date.localeCompare(second.date) || first.odometer - second.odometer;
      case "highest-cost":
        return second.totalCost - first.totalCost || second.date.localeCompare(first.date);
      case "best-economy":
        return (
          (second.economy ?? Number.NEGATIVE_INFINITY) -
            (first.economy ?? Number.NEGATIVE_INFINITY) ||
          second.date.localeCompare(first.date)
        );
      default:
        return second.date.localeCompare(first.date) || second.odometer - first.odometer;
    }
  });
}

function flattenHistoryRows(fillUps: FillUp[], sort: SortOption): HistoryRow[] {
  const groups = new Map<string, FillUp[]>();
  fillUps.forEach((fillUp) => {
    const key = monthKey(fillUp);
    const group = groups.get(key) ?? [];
    group.push(fillUp);
    groups.set(key, group);
  });

  const rows: HistoryRow[] = [];
  [...groups.entries()]
    .sort(([first], [second]) =>
      sort === "oldest" ? first.localeCompare(second) : second.localeCompare(first),
    )
    .forEach(([key, monthFillUps]) => {
      rows.push({
        key: `month-${key}`,
        label: monthLabel(key),
        spend: monthFillUps.reduce((total, fillUp) => total + fillUp.totalCost, 0),
        type: "month",
      });
      monthFillUps.forEach((fillUp) => {
        rows.push({ key: fillUp.id, fillUp, type: "fill" });
      });
    });

  return rows;
}

interface HistoryVirtualListProps {
  allFillUps: FillUp[];
  averageEconomy: number | null;
  baselineFillUpIds: Set<string>;
  currencySymbol: string;
  onDelete: (fillUp: FillUp) => void;
  onEdit: (fillUp: FillUp) => void;
  onRefresh: () => void;
  settings: ReturnType<typeof useAppContext>["settings"];
  sort: SortOption;
  vehicleNames: Map<string, string>;
  vehiclesById: Map<string, ReturnType<typeof useAppContext>["vehicles"][number]>;
}

/**
 * Windowed history stream. The data source is cursor-shaped (30 logs/page) so
 * a future API can replace the local adapter without changing rendering logic.
 */
function HistoryVirtualList({
  allFillUps,
  averageEconomy,
  baselineFillUpIds,
  currencySymbol,
  onDelete,
  onEdit,
  onRefresh,
  settings,
  sort,
  vehicleNames,
  vehiclesById,
}: HistoryVirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [loadedCount, setLoadedCount] = useState(HISTORY_PAGE_SIZE);
  const [expandedFillUpId, setExpandedFillUpId] = useState<string | null>(null);

  const loadedFillUps = useMemo(
    () => allFillUps.slice(0, loadedCount),
    [allFillUps, loadedCount],
  );
  const rows = useMemo(
    () => flattenHistoryRows(loadedFillUps, sort),
    [loadedFillUps, sort],
  );
  const hasNextPage = loadedCount < allFillUps.length;
  // TanStack Virtual intentionally exposes mutable measurement callbacks.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getItemKey: (index) => rows[index]?.key ?? "loading-row",
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.type === "month" ? 44 : 245),
    overscan: 6,
  });

  const fetchNextPage = () => {
    if (!hasNextPage || isFetchingNext) {
      return;
    }

    setIsFetchingNext(true);
    const cursor = String(loadedCount);
    window.setTimeout(() => {
      const page = queryHistoryCursorPage(allFillUps, cursor, HISTORY_PAGE_SIZE);
      setLoadedCount((current) => current + page.items.length);
      setIsFetchingNext(false);
    }, 120);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 480) {
      fetchNextPage();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollTop <= 0) {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    }
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || event.currentTarget.scrollTop > 0) {
      return;
    }
    const distance = (event.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    setPullDistance(Math.min(Math.max(distance, 0), 96));
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 64) {
      setIsRefreshing(true);
      onRefresh();
      window.setTimeout(() => setIsRefreshing(false), 320);
    }
    touchStartY.current = null;
    setPullDistance(0);
  };

  return (
    <div
      className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8"
      onScroll={handleScroll}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={parentRef}
    >
      <div
        className="flex items-center justify-center overflow-hidden text-xs text-text-muted transition-[height,opacity]"
        style={{ height: pullDistance, opacity: pullDistance > 0 || isRefreshing ? 1 : 0 }}
      >
        <LoaderCircle className={isRefreshing ? "animate-spin text-accent" : "text-text-muted"} size={16} />
        <span className="ml-2">{isRefreshing ? "Refreshing logs…" : "Pull to refresh"}</span>
      </div>

      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          const style = {
            position: "absolute" as const,
            top: 0,
            transform: `translateY(${virtualRow.start}px)`,
            width: "100%",
          };

          if (!row) {
            return (
              <div key="loading-row" style={style}>
                <div className="flex h-14 items-center justify-center text-xs text-text-muted">
                  <LoaderCircle aria-hidden="true" className="mr-2 animate-spin text-accent" size={16} />
                  Loading more logs…
                </div>
              </div>
            );
          }

          if (row.type === "month") {
            return (
              <div key={row.key} style={style}>
                <div className="flex h-11 items-end justify-between px-1 pb-2">
                  <h2 className="text-sm font-bold uppercase tracking-[0.04em] text-text-secondary">{row.label}</h2>
                  <span className="text-xs text-text-muted">{currencySymbol}{row.spend.toFixed(2)}</span>
                </div>
              </div>
            );
          }

          return (
            <div data-index={virtualRow.index} key={row.key} ref={virtualizer.measureElement} style={style}>
              <div className="pb-3">
                <FillUpCard
                  averageEconomy={averageEconomy}
                  currencySymbol={currencySymbol}
                  fillUp={row.fillUp}
                  isBaseline={baselineFillUpIds.has(row.fillUp.id)}
                  isExpanded={expandedFillUpId === row.fillUp.id}
                  onDelete={() => onDelete(row.fillUp)}
                  onEdit={() => onEdit(row.fillUp)}
                  onToggle={() =>
                    setExpandedFillUpId((current) =>
                      current === row.fillUp.id ? null : row.fillUp.id,
                    )
                  }
                  settings={settings}
                  vehicle={vehiclesById.get(row.fillUp.vehicleId)}
                  vehicleName={vehicleNames.get(row.fillUp.vehicleId)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Searchable, vehicle-aware, cursor-windowed fill-up history. */
export function HistoryScreen() {
  const {
    deleteFillUp,
    fillUps,
    isHydrated,
    selectedVehicleId,
    settings,
    vehicles,
  } = useAppContext();
  const [search, setSearch] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [fillType, setFillType] = useState<FillTypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [editingFillUpId, setEditingFillUpId] = useState<string | null>(null);
  const [fillUpPendingDelete, setFillUpPendingDelete] = useState<FillUp | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const vehicleNames = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.name])),
    [vehicles],
  );
  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles],
  );
  const scopedFillUps = useMemo(
    () =>
      selectedVehicleId === "all"
        ? fillUps
        : fillUps.filter((fillUp) => fillUp.vehicleId === selectedVehicleId),
    [fillUps, selectedVehicleId],
  );
  const filteredFillUps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return sortFillUps(
      scopedFillUps.filter((fillUp) => {
        const matchesSearch =
          !query ||
          fillUp.station.toLocaleLowerCase().includes(query) ||
          fillUp.notes.toLocaleLowerCase().includes(query) ||
          vehicleNames.get(fillUp.vehicleId)?.toLocaleLowerCase().includes(query) ||
          fillUp.totalCost.toFixed(2).includes(query);
        const matchesType =
          fillType === "all" ||
          (fillType === "full" ? fillUp.isFullTank : !fillUp.isFullTank);

        return matchesSearch && matchesType && isInPeriod(fillUp, timePeriod);
      }),
      sort,
    );
  }, [fillType, scopedFillUps, search, sort, timePeriod, vehicleNames]);
  const globalUnits = resolveUnits(settings);
  const economyValues = filteredFillUps
    .map((fillUp) => fillUp.economy)
    .filter((economy): economy is number => economy !== null);
  const averageEconomy =
    economyValues.length > 0
      ? economyValues.reduce((sum, economy) => sum + economy, 0) / economyValues.length
      : null;
  const bestEconomy = economyValues.length > 0 ? Math.max(...economyValues) : null;
  const worstEconomy = economyValues.length > 0 ? Math.min(...economyValues) : null;
  const baselineFillUpIds = useMemo(() => {
    const firstByVehicle = new Map<string, FillUp>();

    scopedFillUps.forEach((fillUp) => {
      const current = firstByVehicle.get(fillUp.vehicleId);
      if (
        !current ||
        fillUp.date.localeCompare(current.date) < 0 ||
        (fillUp.date === current.date && fillUp.odometer < current.odometer)
      ) {
        firstByVehicle.set(fillUp.vehicleId, fillUp);
      }
    });

    return new Set([...firstByVehicle.values()].map((fillUp) => fillUp.id));
  }, [scopedFillUps]);
  const editingFillUp = fillUps.find((fillUp) => fillUp.id === editingFillUpId) ?? null;
  const editingVehicle = editingFillUp
    ? vehicles.find((vehicle) => vehicle.id === editingFillUp.vehicleId) ?? null
    : null;
  const queryKey = [
    selectedVehicleId ?? "none",
    search,
    timePeriod,
    fillType,
    sort,
    refreshVersion,
  ].join("|");

  const confirmFillUpDelete = () => {
    if (!fillUpPendingDelete) {
      return;
    }

    deleteFillUp(fillUpPendingDelete.id);
    setFillUpPendingDelete(null);
  };

  return (
    <section className="mx-auto flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-[480px] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border-default bg-bg-base/90 px-5 pb-4 pt-[max(1.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <header>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">EVERY DROP, ACCOUNTED</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">History</h1>
            <span className="text-lg font-medium text-text-muted">{scopedFillUps.length}</span>
            <span className="text-xs text-text-muted">{selectedVehicleId === "all" ? "All Vehicles" : vehicleNames.get(selectedVehicleId ?? "")}</span>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["AVG", averageEconomy, "text-text-primary"],
            ["BEST", bestEconomy, "text-success"],
            ["WORST", worstEconomy, "text-reserve"],
          ].map(([label, value, color]) => (
            <div className="rounded-xl bg-bg-card px-3 py-3" key={label as string}>
              <p className={`font-mono text-[22px] font-bold tabular-nums ${color}`}>
                {value === null ? "—" : formatEconomy(value as number, globalUnits).split(" ")[0]}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.05em] text-text-muted">{label} {globalUnits.economyLabel}</p>
            </div>
          ))}
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
          <span className="relative ml-auto">
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

      {!isHydrated ? (
        <div className="grid flex-1 gap-3 px-5 py-6">
          {[0, 1, 2].map((index) => <div className="h-40 animate-pulse rounded-2xl bg-bg-card" key={index} />)}
        </div>
      ) : scopedFillUps.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-accent-glow"><History aria-hidden="true" size={27} /></span>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-text-primary">No fill-ups recorded yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">Your logged fuel stops will be grouped here as your history grows.</p>
        </div>
      ) : filteredFillUps.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <Search aria-hidden="true" size={26} className="text-accent" />
          <h2 className="mt-4 text-lg font-bold text-text-primary">No matching fill-ups</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Try broadening the search or changing a filter.</p>
        </div>
      ) : (
        <HistoryVirtualList
          allFillUps={filteredFillUps}
          averageEconomy={averageEconomy}
          baselineFillUpIds={baselineFillUpIds}
          currencySymbol={settings.currencySymbol}
          key={queryKey}
          onDelete={setFillUpPendingDelete}
          onEdit={(fillUp) => setEditingFillUpId(fillUp.id)}
          onRefresh={() => setRefreshVersion((version) => version + 1)}
          settings={settings}
          sort={sort}
          vehicleNames={vehicleNames}
          vehiclesById={vehiclesById}
        />
      )}

      {editingFillUp && editingVehicle ? <LogFillUpSheet fillUp={editingFillUp} key={editingFillUp.id} onClose={() => setEditingFillUpId(null)} vehicle={editingVehicle} /> : null}

      <ConfirmDialog
        confirmLabel="Delete fill-up"
        description={fillUpPendingDelete ? `This removes the ${fillUpPendingDelete.station || "fuel"} log from ${fillUpPendingDelete.date}. This cannot be undone.` : ""}
        isOpen={Boolean(fillUpPendingDelete)}
        onCancel={() => setFillUpPendingDelete(null)}
        onConfirm={confirmFillUpDelete}
        title="Delete fill-up?"
      />
    </section>
  );
}
