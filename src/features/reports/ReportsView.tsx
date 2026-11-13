import { Fuel, Info } from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimeframePills } from "@/components/ui/TimeframePills";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { ConsumptionTrendChart } from "@/features/reports/ConsumptionTrendChart";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { KeyCostMetrics } from "@/features/reports/KeyCostMetrics";
import { MonthlySpendingChart } from "@/features/reports/MonthlySpendingChart";
import { SpendingBreakdown } from "@/features/reports/SpendingBreakdown";
import type { FuelLogInput } from "@/types";
import type { Timeframe } from "@/utils/dashboardMetrics";
import { buildReportMetrics } from "@/utils/reportMetrics";

export function ReportsView() {
  const { activeVehicle, addFuelLog, expenseRecords, fuelLogs, serviceVisits } = useApp();
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [fuelOpen, setFuelOpen] = useState(false);
  const metrics = useMemo(() => {
    if (!activeVehicle) return null;
    return buildReportMetrics({ expenseRecords, fuelLogs, serviceVisits, timeframe, vehicle: activeVehicle });
  }, [activeVehicle, expenseRecords, fuelLogs, serviceVisits, timeframe]);

  if (!activeVehicle || !metrics) return null;

  const activeFuelOptions = activeVehicle.fuelType === "dual-fuel" ? ["petrol", "lpg"] as const : [activeVehicle.fuelType === "lpg" ? "lpg" : activeVehicle.fuelType === "diesel" ? "diesel" : "petrol"] as const;
  const stations = fuelLogs.map((log) => log.stationName).filter(Boolean);
  const hasReportData = metrics.moneyRecordCount > 0 || metrics.consumptionPoints.length > 0 || metrics.totalDistanceKm > 0;
  const saveFuel = async (input: FuelLogInput) => {
    await addFuelLog(input);
    showToast({ message: "Fuel log saved and reports refreshed.", tone: "success" });
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">ANALYTICS</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.name} reports</h1>
      </div>
      <TimeframePills onChange={setTimeframe} value={timeframe} />
      {!hasReportData ? <Card><EmptyState actionLabel="Log a Fill-Up" description="Add a fuel, service, or expense record to start building live analytics." icon={Fuel} onAction={() => setFuelOpen(true)} title="No report data yet" /></Card> : (
        <div className="motion-chart-enter grid gap-5" data-motion="report-data" key={timeframe}>
          {metrics.excludedCurrencyRecordCount > 0 ? (
            <Card className="flex gap-3 border-amber-300/70 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              <p className="text-sm leading-6 text-amber-900 dark:text-amber-100">Money totals use {activeVehicle.currencyCode} only. <span className="tabular-nums">{metrics.excludedCurrencyRecordCount}</span> native-currency {metrics.excludedCurrencyRecordCount === 1 ? "record is" : "records are"} excluded rather than converted.</p>
            </Card>
          ) : null}
          <Card>
            <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">KEY COST METRICS</p>
            <div className="mt-5">
              <KeyCostMetrics averageFuelPricePerLitre={metrics.averageFuelPricePerLitre} currencyCode={activeVehicle.currencyCode} distanceUnit={activeVehicle.distanceUnit} fuelCostPerDistanceKm={metrics.fuelCostPerDistanceKm} totalCostPerDistanceKm={metrics.totalCostPerDistanceKm} totalDistanceKm={metrics.totalDistanceKm} />
            </div>
          </Card>
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">TOTAL SPENDING</p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Breakdown by category</h2>
              </div>
              <p className="shrink-0 tabular-nums text-sm font-semibold text-red-600 dark:text-red-400">{metrics.moneyRecordCount} records</p>
            </div>
            <div className="mt-5"><SpendingBreakdown categories={metrics.spendingCategories} currencyCode={activeVehicle.currencyCode} onLogFuel={() => setFuelOpen(true)} totalSpending={metrics.totalSpending} /></div>
          </Card>
          <Card>
            <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">MONTHLY SPENDING</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Fuel, service, and expenses</h2>
            <div className="mt-5"><MonthlySpendingChart currencyCode={activeVehicle.currencyCode} months={metrics.monthlySpending} onLogFuel={() => setFuelOpen(true)} /></div>
          </Card>
          <Card>
            <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">CONSUMPTION TREND</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Completed full-tank intervals</h2>
            <div className="mt-5"><ConsumptionTrendChart onLogFuel={() => setFuelOpen(true)} points={metrics.consumptionPoints} unit={activeVehicle.consumptionUnit} /></div>
          </Card>
        </div>
      )}
      <FuelLogSheet activeFuelOptions={[...activeFuelOptions]} onClose={() => setFuelOpen(false)} onSubmit={saveFuel} open={fuelOpen} stationSuggestions={stations} />
    </div>
  );
}
