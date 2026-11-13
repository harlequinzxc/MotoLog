import { Gauge, ReceiptText, Route, Fuel } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { formatDistance, fromKilometres } from "@/lib/units";
import type { DistanceUnit } from "@/types";

interface KeyCostMetricsProps {
  averageFuelPricePerLitre: number | null;
  currencyCode: string;
  distanceUnit: DistanceUnit;
  fuelCostPerDistanceKm: number | null;
  totalCostPerDistanceKm: number | null;
  totalDistanceKm: number;
}

function costPerDistance(valuePerKilometre: number | null, currencyCode: string, distanceUnit: DistanceUnit) {
  if (valuePerKilometre === null) return "—";
  const displayedDistanceForOneKilometre = fromKilometres(1, distanceUnit);
  if (displayedDistanceForOneKilometre <= 0) return "—";
  const unit = distanceUnit === "miles" ? "mi" : "km";
  return `${formatCurrency(valuePerKilometre / displayedDistanceForOneKilometre, currencyCode)}/${unit}`;
}

export function KeyCostMetrics({
  averageFuelPricePerLitre,
  currencyCode,
  distanceUnit,
  fuelCostPerDistanceKm,
  totalCostPerDistanceKm,
  totalDistanceKm
}: KeyCostMetricsProps) {
  const metrics = [
    { icon: Fuel, label: `Fuel cost / ${distanceUnit === "miles" ? "mi" : "km"}`, value: costPerDistance(fuelCostPerDistanceKm, currencyCode, distanceUnit) },
    { icon: ReceiptText, label: `Total cost / ${distanceUnit === "miles" ? "mi" : "km"}`, value: costPerDistance(totalCostPerDistanceKm, currencyCode, distanceUnit) },
    { icon: Gauge, label: "Average fuel price", value: averageFuelPricePerLitre === null ? "—" : `${formatCurrency(averageFuelPricePerLitre, currencyCode)}/L` },
    { icon: Route, label: "Distance driven", value: totalDistanceKm > 0 ? formatDistance(totalDistanceKm, distanceUnit) : "—" }
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
      {metrics.map(({ icon: Icon, label, value }) => (
        <div className="motion-list-item" data-motion="cost-metric" key={label}>
          <Icon aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} />
          <p className="mt-2 tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">{label.toUpperCase()}</p>
        </div>
      ))}
    </div>
  );
}
