import { Bike, CarFront, Clock3, Pencil, Trash2 } from "lucide-react";

import { formatDistance, formatVolume, resolveUnits } from "@/lib/units";
import type { AppSettings, FillUp, Vehicle } from "@/lib/types";

interface VehicleCardProps {
  fillUps: FillUp[];
  settings: AppSettings;
  onDelete: () => void;
  onEdit: () => void;
  onSetActive: () => void;
  vehicle: Vehicle;
}

function lastLoggedLabel(fillUps: FillUp[]) {
  if (fillUps.length === 0) {
    return "Last logged never";
  }

  const latest = fillUps.reduce((latestFillUp, fillUp) =>
    fillUp.date > latestFillUp.date ? fillUp : latestFillUp,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loggedDate = new Date(`${latest.date}T12:00:00`);
  const daysAgo = Math.max(
    0,
    Math.floor((today.getTime() - loggedDate.getTime()) / 86_400_000),
  );

  if (daysAgo === 0) {
    return "Last logged today";
  }

  return `Last logged ${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago`;
}

/** The compact populated-state card used for each saved motorcycle or car. */
export function VehicleCard({
  fillUps,
  onDelete,
  onEdit,
  onSetActive,
  settings,
  vehicle,
}: VehicleCardProps) {
  const Icon = vehicle.type === "motorcycle" ? Bike : CarFront;
  const typeLabel = vehicle.type === "motorcycle" ? "Motorcycle" : "Car";
  const units = resolveUnits(settings, vehicle);
  const tankValue = formatVolume(vehicle.tankCapacity, units);

  return (
    <article className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-[0_16px_40px_rgb(0_0_0_/_0.16)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
          <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-text-primary">
                {vehicle.name}
              </h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                {typeLabel}
                {vehicle.year ? ` · ${vehicle.year}` : " · Year unknown"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.11em] ${
                vehicle.isActive
                  ? "bg-accent/15 text-accent"
                  : "border border-border-default bg-bg-input text-text-muted"
              }`}
            >
              {vehicle.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-border-default bg-bg-input">
        <div className="border-r border-border-default px-3 py-3">
          <dt className="text-[9px] font-bold tracking-[0.12em] text-text-muted">
            ODOMETER
          </dt>
          <dd className="mt-1 truncate text-sm font-bold font-mono tabular-nums text-text-primary">
            {formatDistance(vehicle.currentOdometer, units)}
          </dd>
        </div>
        <div className="border-r border-border-default px-3 py-3">
          <dt className="text-[9px] font-bold tracking-[0.12em] text-text-muted">
            TANK
          </dt>
          <dd className="mt-1 truncate text-sm font-bold font-mono tabular-nums text-text-primary">
            {tankValue}
          </dd>
        </div>
        <div className="px-3 py-3">
          <dt className="text-[9px] font-bold tracking-[0.12em] text-text-muted">
            FILL-UPS
          </dt>
          <dd className="mt-1 text-sm font-bold font-mono tabular-nums text-text-primary">
            {fillUps.length}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-text-muted">
          <Clock3 aria-hidden="true" size={14} className="shrink-0 text-accent" />
          <span className="truncate">{lastLoggedLabel(fillUps)}</span>
        </p>
        {!vehicle.isActive ? (
          <button
            className="shrink-0 rounded-xl bg-accent px-3 py-2 text-[10px] font-bold tracking-[0.08em] text-text-primary shadow-accent-glow transition-transform hover:brightness-110 active:scale-[0.98]"
            onClick={onSetActive}
            type="button"
          >
            SET ACTIVE
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border-default pt-4">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-input text-xs font-bold text-text-primary transition-colors hover:border-accent/40 hover:bg-bg-card"
          onClick={onEdit}
          type="button"
        >
          <Pencil aria-hidden="true" size={15} className="text-accent" />
          Edit
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
          onClick={onDelete}
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}
