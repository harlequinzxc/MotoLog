import { useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { TimeframePills } from "@/components/ui/TimeframePills";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { ConsumptionGauge } from "@/features/dashboard/ConsumptionGauge";
import { NextFillPredictor } from "@/features/dashboard/NextFillPredictor";
import { RecentActivity, type ActivityItem } from "@/features/dashboard/RecentActivity";
import { ExpenseSheet } from "@/features/expenses/ExpenseSheet";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { ServiceVisitSheet } from "@/features/service/ServiceVisitSheet";
import type { ExpenseInput, ExpenseRecord, FuelLog, FuelLogInput, ServiceVisit, ServiceVisitInput } from "@/types";
import { efficiencyMetrics, logsForTimeframe, nextFillPredictor, type Timeframe } from "@/utils/dashboardMetrics";

export function DashboardView() {
  const { activeVehicle, expenseRecords, fuelLogs, serviceItems, serviceVisitItems, serviceVisits, updateExpense, updateFuelLog, updateServiceVisit } = useApp();
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [editingFuel, setEditingFuel] = useState<FuelLog | undefined>();
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | undefined>();
  const [editingVisit, setEditingVisit] = useState<ServiceVisit | undefined>();
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const logs = useMemo(() => fuelLogs.filter((log) => log.vehicleId === activeVehicle?.id), [activeVehicle?.id, fuelLogs]);
  const scopedLogs = useMemo(() => logsForTimeframe(logs, timeframe), [logs, timeframe]);
  const metrics = efficiencyMetrics(scopedLogs);

  if (!activeVehicle) return null;

  const predictor = nextFillPredictor(activeVehicle, logs);
  const items = serviceItems.filter((item) => item.vehicleId === activeVehicle.id);
  const visits = serviceVisits.filter((visit) => visit.vehicleId === activeVehicle.id);
  const itemIdsForVisit = (visitId: string) => serviceVisitItems.filter((link) => link.visitId === visitId).map((link) => link.serviceItemId);
  const activity: ActivityItem[] = [
    ...logs.map((log) => ({ id: log.id, occurredAt: log.occurredAt, title: `Fuel · ${log.stationName}`, subtitle: `${log.currencyCode} ${log.totalCost?.toFixed(2) ?? "—"}`, type: "fuel" as const, onEdit: () => { setEditingFuel(log); setFuelOpen(true); } })),
    ...visits.map((visit) => ({ id: visit.id, occurredAt: visit.occurredAt, title: `Service · ${itemIdsForVisit(visit.id).map((id) => items.find((item) => item.id === id)?.title ?? "Service").join(", ")}`, subtitle: `${visit.currencyCode} ${visit.totalCost.toFixed(2)}`, type: "service" as const, onEdit: () => { setEditingVisit(visit); setServiceOpen(true); } })),
    ...expenseRecords.filter((expense) => expense.vehicleId === activeVehicle.id).map((expense) => ({ id: expense.id, occurredAt: expense.occurredAt, title: `Expense · ${expense.category}`, subtitle: `${expense.currencyCode} ${expense.totalCost.toFixed(2)}`, type: "expense" as const, onEdit: () => { setEditingExpense(expense); setExpenseOpen(true); } }))
  ].sort((first, second) => second.occurredAt.localeCompare(first.occurredAt));
  const activeFuelOptions = activeVehicle.fuelType === "dual-fuel" ? ["petrol", "lpg"] as const : [activeVehicle.fuelType === "lpg" ? "lpg" : activeVehicle.fuelType === "diesel" ? "diesel" : "petrol"] as const;
  const stations = fuelLogs.map((log) => log.stationName).filter(Boolean);
  const openNewFuel = () => {
    setEditingFuel(undefined);
    setFuelOpen(true);
  };
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

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">LIVE CONSUMPTION</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.name}</h1>
      </div>
      <TimeframePills onChange={setTimeframe} value={timeframe} />
      <Card><ConsumptionGauge average={metrics.average} best={metrics.best} trendPercent={metrics.trendPercent} unit={activeVehicle.consumptionUnit} worst={metrics.worst} /></Card>
      <NextFillPredictor distanceUnit={activeVehicle.distanceUnit} onLogFuel={openNewFuel} value={predictor} volumeUnit={activeVehicle.volumeUnit} />
      <RecentActivity items={activity} onLogFuel={openNewFuel} />
      <FuelLogSheet activeFuelOptions={[...activeFuelOptions]} log={editingFuel} onClose={() => setFuelOpen(false)} onSubmit={saveFuel} open={fuelOpen} stationSuggestions={stations} />
      <ExpenseSheet currencyCode={activeVehicle.currencyCode} expense={editingExpense} onClose={() => setExpenseOpen(false)} onSubmit={saveExpense} open={expenseOpen} />
      <ServiceVisitSheet currencyCode={activeVehicle.currencyCode} items={items} onClose={() => setServiceOpen(false)} onSubmit={saveVisit} open={serviceOpen} visit={editingVisit} visitItemIds={editingVisit ? itemIdsForVisit(editingVisit.id) : []} />
    </div>
  );
}
