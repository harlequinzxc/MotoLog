import { Gauge, Route, WalletCards } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppProvider";
import { displayEfficiency } from "@/utils/fuelMath";

export function DashboardView() {
  const { activeVehicle, fuelLogs, settings } = useApp();
  if (!activeVehicle || !settings) return null;
  const logs = fuelLogs.filter((log) => log.vehicleId === activeVehicle.id);
  const efficiencies = logs.flatMap((log) => log.efficiencyKmPerLitre === null ? [] : [log.efficiencyKmPerLitre]);
  const averageEfficiency = efficiencies.length === 0 ? null : efficiencies.reduce((total, value) => total + value, 0) / efficiencies.length;
  const lastEfficiency = efficiencies[0] ?? null;
  const totalSpend = logs.filter((log) => log.currencyCode === "SGD").reduce((total, log) => total + log.totalCost, 0);
  const totalDistance = logs.reduce((total, log) => total + (log.distanceKm ?? 0), 0);
  const stats = [
    { icon: Gauge, label: "AVG EFFICIENCY", value: displayEfficiency(averageEfficiency, settings.efficiencyUnit) },
    { icon: Gauge, label: "LAST FILL-UP", value: displayEfficiency(lastEfficiency, settings.efficiencyUnit) },
    { icon: WalletCards, label: "TOTAL SPEND", value: `S$${totalSpend.toFixed(2)}` },
    { icon: Route, label: "TOTAL DISTANCE", value: totalDistance > 0 ? `${totalDistance.toLocaleString()} km` : "—" }
  ];
  return <div className="grid gap-5"><div><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">FUEL DASHBOARD</p><h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.name}</h1></div><div className="grid grid-cols-2 gap-3">{stats.map(({ icon: Icon, label, value }) => <Card className="p-4" key={label}><Icon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /><p className="mt-4 tabular-nums text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</p><p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p></Card>)}</div><Card><p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">SGD totals exclude unconverted MYR source-currency logs. Native amounts remain intact for future FX reporting.</p></Card></div>;
}
