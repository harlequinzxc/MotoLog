import { Bike, CarFront, Check, Pencil, Trash2 } from "lucide-react";

import { formatDistance, formatVolume, resolveUnits } from "@/lib/units";
import type { AppSettings, FillUp, Vehicle } from "@/lib/types";

interface VehicleCardProps {
  fillUps: FillUp[];
  onDelete: () => void;
  onEdit: () => void;
  onSetActive: () => void;
  settings: AppSettings;
  vehicle: Vehicle;
}

function lastLoggedLabel(fillUps: FillUp[]) {
  if (fillUps.length === 0) {
    return { detail: "", label: "No logs yet" };
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
    return { detail: "today", label: "Last logged" };
  }

  return { detail: `${daysAgo}d`, label: "Last logged" };
}

/** Premium populated-state card for each saved motorcycle or car. */
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
  const lastLogged = lastLoggedLabel(fillUps);

  return (
    <article
      className={`rounded-2xl border border-border-default border-l-[3px] bg-bg-card p-5 transition-shadow ${
        vehicle.isActive
          ? "border-l-accent shadow-[-4px_0_24px_rgb(var(--color-accent)_/_0.15)]"
          : "border-l-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            vehicle.isActive
              ? "bg-accent/15 text-accent"
              : "bg-bg-elevated text-text-muted"
          }`}
        >
          <Icon aria-hidden="true" size={21} strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-bold tracking-tight text-text-primary">
            {vehicle.name}
          </h2>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {typeLabel} · {vehicle.year ?? "—"} · {units.distanceLabel} · {units.volumeLabel}
          </p>
        </div>
        {vehicle.isActive ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
            <Check aria-hidden="true" size={13} strokeWidth={3} />
            Active
          </span>
        ) : (
          <button
            className="shrink-0 rounded-full border border-border-default px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted hover:border-accent/40 hover:text-text-secondary"
            onClick={onSetActive}
            type="button"
          >
            Set active
          </button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-bg-elevated p-3">
          <dd className="truncate font-mono text-base font-bold tabular-nums text-text-primary">
            {formatDistance(vehicle.currentOdometer, units)}
          </dd>
          <dt className="mt-1 text-[9px] font-medium uppercase tracking-[0.05em] text-text-muted">
            Odometer
          </dt>
        </div>
        <div className="rounded-xl bg-bg-elevated p-3">
          <dd className="truncate font-mono text-base font-bold tabular-nums text-text-primary">
            {tankValue}
          </dd>
          <dt className="mt-1 text-[9px] font-medium uppercase tracking-[0.05em] text-text-muted">
            Tank
          </dt>
        </div>
        <div className="rounded-xl bg-bg-elevated p-3">
          <dd className="font-mono text-base font-bold tabular-nums text-text-primary">
            {fillUps.length}
          </dd>
          <dt className="mt-1 text-[9px] font-medium uppercase tracking-[0.05em] text-text-muted">
            Fill-ups
          </dt>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-border-default pt-4">
        <p className="text-xs italic text-text-muted">
          {lastLogged.detail ? (
            <>
              {lastLogged.label} <span className="font-semibold not-italic text-text-secondary">{lastLogged.detail}</span> ago
            </>
          ) : (
            lastLogged.label
          )}
        </p>
        <div className="flex items-center gap-5">
          <button
            className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary"
            onClick={onEdit}
            type="button"
          >
            <Pencil aria-hidden="true" size={14} />
            Edit
          </button>
          <button
            className="flex items-center gap-1.5 text-[13px] font-medium text-accent hover:brightness-125"
            onClick={onDelete}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
