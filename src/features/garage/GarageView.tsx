import { Bike, CarFront, CirclePlus, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { VehicleFormSheet } from "@/features/garage/VehicleFormSheet";
import type { Vehicle, VehicleInput } from "@/types";

export function GarageView() {
  const { activeVehicle, createVehicle, setActiveVehicle, updateVehicle, vehicles } = useApp();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Vehicle | undefined>();
  const [open, setOpen] = useState(false);
  const save = async (input: VehicleInput) => {
    if (editing) { await updateVehicle(editing.id, input); showToast({ message: "Vehicle updated.", tone: "success" }); }
    else { await createVehicle(input); showToast({ message: "Vehicle added.", tone: "success" }); }
  };
  return <div className="grid gap-5"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">VEHICLE GARAGE</p><h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Your vehicles</h1></div><Button onClick={() => { setEditing(undefined); setOpen(true); }} size="sm"><CirclePlus className="size-5" strokeWidth={2} />Add</Button></div><div className="grid gap-3">{vehicles.map((vehicle) => { const Icon = vehicle.type === "motorcycle" ? Bike : CarFront; const active = vehicle.id === activeVehicle?.id; return <Card className={active ? "border-red-500/50" : undefined} key={vehicle.id}><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><Icon aria-hidden="true" className="size-5" strokeWidth={2} /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{vehicle.name}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{vehicle.type} · {vehicle.tankCapacityLitres} L · <span className="tabular-nums">{vehicle.currentOdometerKm.toLocaleString()} km</span></p></div><Button disabled={active} onClick={() => void setActiveVehicle(vehicle.id)} size="sm" variant={active ? "secondary" : "ghost"}>{active ? "Active" : "Use"}</Button><Button aria-label={`Edit ${vehicle.name}`} onClick={() => { setEditing(vehicle); setOpen(true); }} size="sm" variant="ghost"><Pencil className="size-4" strokeWidth={2} /></Button></div></Card>; })}</div><VehicleFormSheet onClose={() => setOpen(false)} onSubmit={save} open={open} vehicle={editing} /></div>;
}
