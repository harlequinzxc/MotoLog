import { Fuel, ReceiptText, Search, Trash2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { ExpenseSheet } from "@/features/expenses/ExpenseSheet";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { ServiceVisitSheet } from "@/features/service/ServiceVisitSheet";
import { formatLocalDateTime } from "@/lib/date";
import type { ExpenseInput, ExpenseRecord, FuelLog, FuelLogInput, ServiceVisit, ServiceVisitInput } from "@/types";

type Filter = "all" | "expense" | "fuel" | "service";
type LogEntry = {
  id: string;
  occurredAt: string;
  subtitle: string;
  title: string;
  type: Exclude<Filter, "all">;
  onDelete: () => Promise<void>;
  onEdit: () => void;
};

export function LogbookView() {
  const {
    activeVehicle,
    deleteExpense,
    deleteFuelLog,
    deleteServiceVisit,
    expenseRecords,
    fuelLogs,
    restoreSnapshot,
    serviceItems,
    serviceVisitItems,
    serviceVisits,
    updateExpense,
    updateFuelLog,
    updateServiceVisit
  } = useApp();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editingFuel, setEditingFuel] = useState<FuelLog | undefined>();
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | undefined>();
  const [editingVisit, setEditingVisit] = useState<ServiceVisit | undefined>();
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const items = useMemo(
    () => serviceItems.filter((item) => item.vehicleId === activeVehicle?.id),
    [activeVehicle?.id, serviceItems]
  );
  const visits = useMemo(
    () => serviceVisits.filter((visit) => visit.vehicleId === activeVehicle?.id),
    [activeVehicle?.id, serviceVisits]
  );
  const itemIdsForVisit = (visitId: string) =>
    serviceVisitItems.filter((link) => link.visitId === visitId).map((link) => link.serviceItemId);
  const stations = fuelLogs.map((log) => log.stationName).filter(Boolean);

  const entries = useMemo<LogEntry[]>(() => {
    if (!activeVehicle) return [];
    const fuelEntries: LogEntry[] = fuelLogs
      .filter((log) => log.vehicleId === activeVehicle.id)
      .map((log) => ({
        id: log.id,
        type: "fuel",
        occurredAt: log.occurredAt,
        title: `Fuel · ${log.stationName}`,
        subtitle: `${log.currencyCode} ${log.totalCost?.toFixed(2) ?? "—"} · ${log.mode}`,
        onEdit: () => {
          setEditingFuel(log);
          setFuelOpen(true);
        },
        onDelete: async () => {
          const snapshot = await deleteFuelLog(log.id);
          if (snapshot) {
            showToast({ actionLabel: "Undo", message: "Fuel log deleted.", onAction: () => restoreSnapshot(snapshot), tone: "success" });
          }
        }
      }));
    const serviceEntries: LogEntry[] = visits.map((visit) => ({
      id: visit.id,
      type: "service",
      occurredAt: visit.occurredAt,
      title: `Service · ${itemIdsForVisit(visit.id).map((id) => items.find((item) => item.id === id)?.title ?? "Service").join(", ")}`,
      subtitle: `${visit.currencyCode} ${visit.totalCost.toFixed(2)}`,
      onEdit: () => {
        setEditingVisit(visit);
        setServiceOpen(true);
      },
      onDelete: async () => {
        const snapshot = await deleteServiceVisit(visit.id);
        showToast({ actionLabel: "Undo", message: "Service visit deleted.", onAction: () => restoreSnapshot(snapshot), tone: "success" });
      }
    }));
    const expenseEntries: LogEntry[] = expenseRecords
      .filter((expense) => expense.vehicleId === activeVehicle.id)
      .map((expense) => ({
        id: expense.id,
        type: "expense",
        occurredAt: expense.occurredAt,
        title: `Expense · ${expense.category}`,
        subtitle: `${expense.currencyCode} ${expense.totalCost.toFixed(2)}`,
        onEdit: () => {
          setEditingExpense(expense);
          setExpenseOpen(true);
        },
        onDelete: async () => {
          const snapshot = await deleteExpense(expense.id);
          showToast({ actionLabel: "Undo", message: "Expense deleted.", onAction: () => restoreSnapshot(snapshot), tone: "success" });
        }
      }));
    return [...fuelEntries, ...serviceEntries, ...expenseEntries].sort((first, second) => second.occurredAt.localeCompare(first.occurredAt));
  }, [activeVehicle, deleteExpense, deleteFuelLog, deleteServiceVisit, expenseRecords, fuelLogs, items, restoreSnapshot, serviceVisitItems, showToast, visits]);

  const filtered = entries.filter((entry) => (filter === "all" || entry.type === filter) && `${entry.title} ${entry.subtitle}`.toLowerCase().includes(search.toLowerCase()));
  const iconFor = { fuel: Fuel, service: Wrench, expense: ReceiptText } as const;
  const saveFuel = async (input: FuelLogInput) => {
    if (!editingFuel) return;
    await updateFuelLog(editingFuel.id, input);
    showToast({ message: "Fuel log updated.", tone: "success" });
  };
  const saveExpense = async (input: ExpenseInput) => {
    if (!editingExpense) return;
    await updateExpense(editingExpense.id, input);
    showToast({ message: "Expense updated.", tone: "success" });
  };
  const saveVisit = async (input: ServiceVisitInput) => {
    if (!editingVisit) return;
    await updateServiceVisit(editingVisit.id, input);
    showToast({ message: "Service visit updated.", tone: "success" });
  };
  if (!activeVehicle) return null;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">UNIFIED ACTIVITY</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Logbook</h1>
      </div>
      <label className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
        <input className="h-12 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-3 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" onChange={(event) => setSearch(event.target.value)} placeholder="Search station or notes" value={search} />
      </label>
      <div className="grid grid-cols-4 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["all", "fuel", "service", "expense"] as Filter[]).map((value) => (
          <button aria-pressed={filter === value} className={`min-h-[44px] rounded-xl text-xs font-semibold ${filter === value ? "bg-red-600 text-white dark:bg-red-500" : "text-zinc-500 dark:text-zinc-400"}`} key={value} onClick={() => setFilter(value)} type="button">{value === "all" ? "All" : value === "fuel" ? "Fuel" : value === "service" ? "Service" : "Expenses"}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map((entry) => {
          const Icon = iconFor[entry.type];
          return <Card key={entry.id}><div className="flex items-start gap-3"><Icon aria-hidden="true" className="mt-0.5 size-5 text-red-500" strokeWidth={2} /><button className="min-w-0 flex-1 text-left" onClick={entry.onEdit} type="button"><p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{entry.title}</p><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{entry.subtitle}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatLocalDateTime(entry.occurredAt)}</p></button><Button aria-label={`Delete ${entry.title}`} onClick={() => void entry.onDelete()} size="sm" variant="danger"><Trash2 className="size-4" strokeWidth={2} /></Button></div></Card>;
        })}
        {filtered.length === 0 ? <Card className="text-center text-sm text-zinc-600 dark:text-zinc-400">No matching activity.</Card> : null}
      </div>
      <FuelLogSheet activeFuelOptions={activeVehicle.fuelType === "dual-fuel" ? ["petrol", "lpg"] : [activeVehicle.fuelType === "lpg" ? "lpg" : activeVehicle.fuelType === "diesel" ? "diesel" : "petrol"]} log={editingFuel} onClose={() => setFuelOpen(false)} onSubmit={saveFuel} open={fuelOpen} stationSuggestions={stations} />
      <ExpenseSheet currencyCode={activeVehicle.currencyCode} expense={editingExpense} onClose={() => setExpenseOpen(false)} onSubmit={saveExpense} open={expenseOpen} />
      <ServiceVisitSheet currencyCode={activeVehicle.currencyCode} items={items} onClose={() => setServiceOpen(false)} onSubmit={saveVisit} open={serviceOpen} visit={editingVisit} visitItemIds={editingVisit ? itemIdsForVisit(editingVisit.id) : []} />
    </div>
  );
}
