import { Bike, CarFront, CirclePlus, Fuel, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import type { Vehicle, VehicleInput } from "@/types";
import { FixedCostFormSheet } from "@/features/garage/FixedCostFormSheet";
import { FixedCostList } from "@/features/garage/FixedCostList";
import { VehicleFormSheet } from "@/features/garage/VehicleFormSheet";

export function GarageView() {
  const {
    activeVehicle,
    addFixedCost,
    createVehicle,
    deleteVehicle,
    fixedCosts,
    setActiveVehicle,
    updateVehicle,
    vehicles
  } = useApp();
  const { showToast } = useToast();
  const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false);
  const [isFixedCostSheetOpen, setIsFixedCostSheetOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const activeCosts = useMemo(
    () => fixedCosts.filter((cost) => cost.vehicleId === activeVehicle?.id),
    [activeVehicle?.id, fixedCosts]
  );

  const openCreate = () => {
    setEditingVehicle(undefined);
    setIsVehicleSheetOpen(true);
  };

  const saveVehicle = async (input: VehicleInput) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.id, input);
      showToast({ message: "Vehicle updated.", tone: "success" });
      return;
    }
    await createVehicle(input);
    showToast({ message: "Vehicle and service presets added.", tone: "success" });
  };

  const removeVehicle = async (vehicle: Vehicle) => {
    const undo = await deleteVehicle(vehicle.id);
    showToast({
      actionLabel: "Undo",
      message: `${vehicle.name} removed.`,
      onAction: undo,
      tone: "success"
    });
  };

  const activateVehicle = async (vehicleId: string) => {
    await setActiveVehicle(vehicleId);
    showToast({ message: "Active vehicle updated.", tone: "success" });
  };

  return (
    <div className="grid gap-6">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">MULTI-VEHICLE GARAGE</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Your vehicles</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <CirclePlus className="size-5" strokeWidth={2} />
          Add
        </Button>
      </section>

      {vehicles.length === 0 ? (
        <Card className="text-center">
          <Fuel aria-hidden="true" className="mx-auto size-8 text-red-500" strokeWidth={2} />
          <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">No vehicles yet</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Add a car or motorcycle to begin tracking ownership.</p>
          <Button className="mt-4" onClick={openCreate}>Add a vehicle</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vehicles.map((vehicle) => {
            const Icon = vehicle.type === "motorcycle" ? Bike : CarFront;
            const isActive = vehicle.id === activeVehicle?.id;
            return (
              <Card className={isActive ? "border-red-500/50" : undefined} key={vehicle.id}>
                <div className="flex gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{vehicle.name}</h2>
                        <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{vehicle.makeModel} · {vehicle.plateNumber || "No plate"}</p>
                      </div>
                      <span className="tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{vehicle.currentOdometerKm.toLocaleString()} km</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button disabled={isActive} onClick={() => activateVehicle(vehicle.id)} size="sm" variant={isActive ? "secondary" : "ghost"}>{isActive ? "Active" : "Set active"}</Button>
                      <Button onClick={() => { setEditingVehicle(vehicle); setIsVehicleSheetOpen(true); }} size="sm" variant="ghost"><Pencil className="size-4" strokeWidth={2} />Edit</Button>
                      <Button onClick={() => void removeVehicle(vehicle)} size="sm" variant="danger"><Trash2 className="size-4" strokeWidth={2} />Delete</Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeVehicle ? (
        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">FIXED OWNERSHIP COSTS</p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.name}</h2>
            </div>
            <Button onClick={() => setIsFixedCostSheetOpen(true)} size="sm" variant="secondary">Add cost</Button>
          </div>
          <FixedCostList costs={activeCosts} />
        </section>
      ) : null}

      <VehicleFormSheet
        onClose={() => setIsVehicleSheetOpen(false)}
        onSubmit={saveVehicle}
        open={isVehicleSheetOpen}
        vehicle={editingVehicle}
      />
      {activeVehicle ? <FixedCostFormSheet onClose={() => setIsFixedCostSheetOpen(false)} onSubmit={(input) => addFixedCost(activeVehicle.id, input).then(() => showToast({ message: "Fixed cost added.", tone: "success" }))} open={isFixedCostSheetOpen} /> : null}
    </div>
  );
}
