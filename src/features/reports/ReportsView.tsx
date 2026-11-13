import { Fuel, Info } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup } from "@/components/ui/ListGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
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

function ReportSection({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800"><p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h2><div className="mt-5">{children}</div></section>;
}

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
    <div className="grid gap-6">
      <SectionHeader eyebrow="ANALYTICS" title={`${activeVehicle.name} insights`} />
      <TimeframePills onChange={setTimeframe} value={timeframe} />
      {!hasReportData ? <ListGroup><EmptyState actionLabel="Log a Fill-Up" description="Add a fuel, service, or expense record to turn this into a useful ownership ledger." icon={Fuel} onAction={() => setFuelOpen(true)} title="No usable report data" /></ListGroup> : (
        <div className="motion-chart-enter grid gap-7" data-motion="report-data" key={timeframe}>
          {metrics.excludedCurrencyRecordCount > 0 ? <div className="flex gap-3 border-l-2 border-amber-500 py-1 pl-4"><Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} /><p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">Money totals use {activeVehicle.currencyCode} only. <span className="tabular-nums">{metrics.excludedCurrencyRecordCount}</span> native-currency {metrics.excludedCurrencyRecordCount === 1 ? "record is" : "records are"} excluded instead of silently converted.</p></div> : null}
          <ReportSection eyebrow="COST SIGNAL" title="What this vehicle is costing">
            <ListGroup className="p-4"><KeyCostMetrics averageFuelPricePerLitre={metrics.averageFuelPricePerLitre} currencyCode={activeVehicle.currencyCode} distanceUnit={activeVehicle.distanceUnit} fuelCostPerDistanceKm={metrics.fuelCostPerDistanceKm} totalCostPerDistanceKm={metrics.totalCostPerDistanceKm} totalDistanceKm={metrics.totalDistanceKm} /></ListGroup>
          </ReportSection>
          <ReportSection eyebrow="SPEND MIX" title="Where the money went">
            <div className="flex items-center justify-end"><p className="tabular-nums text-xs font-semibold tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{metrics.moneyRecordCount} RECORDS</p></div>
            <div className="mt-3"><SpendingBreakdown categories={metrics.spendingCategories} currencyCode={activeVehicle.currencyCode} onLogFuel={() => setFuelOpen(true)} totalSpending={metrics.totalSpending} /></div>
          </ReportSection>
          <ReportSection eyebrow="RUN RATE" title="Monthly ownership spend"><MonthlySpendingChart currencyCode={activeVehicle.currencyCode} months={metrics.monthlySpending} onLogFuel={() => setFuelOpen(true)} /></ReportSection>
          <ReportSection eyebrow="EFFICIENCY" title="Completed tank intervals"><ConsumptionTrendChart onLogFuel={() => setFuelOpen(true)} points={metrics.consumptionPoints} unit={activeVehicle.consumptionUnit} /></ReportSection>
        </div>
      )}
      <FuelLogSheet activeFuelOptions={[...activeFuelOptions]} onClose={() => setFuelOpen(false)} onSubmit={saveFuel} open={fuelOpen} stationSuggestions={stations} />
    </div>
  );
}
