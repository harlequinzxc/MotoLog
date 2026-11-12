import { Gauge, Route, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppProvider";
import { formatDistance, formatEfficiency } from "@/lib/units";

export function DashboardView() {
  const { activeVehicle, fuelLogs } = useApp();
  if (!activeVehicle) return null;
  const logs = fuelLogs.filter((log) => log.vehicleId === activeVehicle.id);
  const efficiencies = logs.flatMap((log) => log.efficiencyKmPerLitre === null ? [] : [log.efficiencyKmPerLitre]);
  const average = efficiencies.length ? efficiencies.reduce((total, item) => total + item, 0) / efficiencies.length : null;
  const last = efficiencies[0] ?? null;
  const totalSpend = logs.filter((log) => log.currencyCode === activeVehicle.currencyCode).reduce((total, log) => total + (log.totalCost ?? 0), 0);
  const distance = logs.reduce((total, log) => total + (log.distanceKm ?? 0), 0);
  const stats = [{ icon: Gauge, label: "AVG EFFICIENCY", value: formatEfficiency(average, activeVehicle.consumptionUnit) }, { icon: Gauge, label: "LAST FILL-UP", value: formatEfficiency(last, activeVehicle.consumptionUnit) }, { icon: WalletCards, label: "TOTAL SPEND", value: `${activeVehicle.currencyCode} ${totalSpend.toFixed(2)}` }, { icon: Route, label: "TOTAL DISTANCE", value: distance > 0 ? formatDistance(distance, activeVehicle.distanceUnit) : "—" }];
  return <div className="grid gap-5"><div><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">FUEL DASHBOARD</p><h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.name}</h1></div><div className="grid grid-cols-2 gap-3">{stats.map(({ icon: Icon, label, value }) => <Card className="p-4" key={label}><Icon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /><p className="mt-4 tabular-nums text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</p><p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p></Card>)}</div><Card><p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">Totals only include transactions in {activeVehicle.currencyCode}. Other source currencies remain intact rather than being converted without an FX rate.</p></Card></div>;
}
