import { Bike, CarFront, CirclePlus, Pencil } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListGroup } from "@/components/ui/ListGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { VehicleFormSheet } from "@/features/garage/VehicleFormSheet";
import { formatDistance, formatVolume } from "@/lib/units";
import type { Vehicle, VehicleInput } from "@/types";

export function GarageView() {
  const { activeVehicle, createVehicle, setActiveVehicle, updateVehicle, vehicles } = useApp();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Vehicle | undefined>();
  const [open, setOpen] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const save = async (input: VehicleInput) => {
    if (editing) {
      await updateVehicle(editing.id, input);
      showToast({ message: "Vehicle updated.", tone: "success" });
    } else {
      await createVehicle(input);
      showToast({ message: "Vehicle added.", tone: "success" });
    }
  };

  const activate = async (vehicle: Vehicle) => {
    if (activatingId || vehicle.id === activeVehicle?.id) return;
    setActivatingId(vehicle.id);
    try {
      await setActiveVehicle(vehicle.id);
      showToast({ message: `${vehicle.name} is now active.`, tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to switch vehicles.", tone: "error" });
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="grid gap-6">
      <SectionHeader action={<Button onClick={() => { setEditing(undefined); setOpen(true); }} size="sm"><CirclePlus className="size-4" strokeWidth={2} />Add vehicle</Button>} eyebrow="GARAGE" title="Your vehicles" />
      <ListGroup>
        {vehicles.map((vehicle, index) => {
          const Icon = vehicle.type === "motorcycle" ? Bike : CarFront;
          const active = vehicle.id === activeVehicle?.id;
          return (
            <div className={`motion-list-item flex items-center gap-3 px-4 py-4 ${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}`} data-motion="garage-vehicle" key={vehicle.id}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}><Icon aria-hidden="true" className="size-5" strokeWidth={2} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{vehicle.name}</p>
                  {active ? <Badge tone="danger">Active</Badge> : null}
                </div>
                <p className="mt-1 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{vehicle.type} · {vehicle.fuelType} · {formatVolume(vehicle.tankCapacityLitres, vehicle.volumeUnit)} · {formatDistance(vehicle.currentOdometerKm, vehicle.distanceUnit)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button disabled={active || activatingId !== null} loading={activatingId === vehicle.id} onClick={() => void activate(vehicle)} size="sm" variant={active ? "ghost" : "secondary"}>{active ? "Current" : "Use"}</Button>
                <Button aria-label={`Edit ${vehicle.name}`} onClick={() => { setEditing(vehicle); setOpen(true); }} size="sm" variant="ghost"><Pencil className="size-4" strokeWidth={2} /></Button>
              </div>
            </div>
          );
        })}
      </ListGroup>
      <VehicleFormSheet onClose={() => setOpen(false)} onSubmit={save} open={open} vehicle={editing} />
    </div>
  );
}
