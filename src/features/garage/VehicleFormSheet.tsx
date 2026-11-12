import { Bike, CarFront, Fuel, Gauge, Hash, Tag } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Vehicle, VehicleInput, VehicleType } from "@/types";

interface VehicleFormSheetProps {
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  open: boolean;
  vehicle?: Vehicle;
}

interface FormState {
  currentOdometerKm: string;
  defaultFuelGrade: string;
  makeModel: string;
  name: string;
  plateNumber: string;
  tankCapacityLitres: string;
  type: VehicleType;
  year: string;
}

const emptyState: FormState = {
  currentOdometerKm: "",
  defaultFuelGrade: "RON 95",
  makeModel: "",
  name: "",
  plateNumber: "",
  tankCapacityLitres: "",
  type: "motorcycle",
  year: ""
};

function stateFromVehicle(vehicle?: Vehicle): FormState {
  if (!vehicle) return emptyState;
  return {
    currentOdometerKm: String(vehicle.currentOdometerKm),
    defaultFuelGrade: vehicle.defaultFuelGrade,
    makeModel: vehicle.makeModel,
    name: vehicle.name,
    plateNumber: vehicle.plateNumber,
    tankCapacityLitres: String(vehicle.tankCapacityLitres),
    type: vehicle.type,
    year: vehicle.year?.toString() ?? ""
  };
}

export function VehicleFormSheet({ onClose, onSubmit, open, vehicle }: VehicleFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => stateFromVehicle(vehicle));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(stateFromVehicle(vehicle));
      setError(null);
      setIsSaving(false);
    }
  }, [open, vehicle]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tankCapacityLitres = Number(form.tankCapacityLitres);
    const currentOdometerKm = Number(form.currentOdometerKm);
    const year = form.year.trim() ? Number(form.year) : null;

    if (!form.name.trim() || !form.makeModel.trim()) {
      setError("Give this vehicle a name and make/model.");
      return;
    }
    if (!Number.isFinite(tankCapacityLitres) || tankCapacityLitres <= 0) {
      setError("Tank capacity must be greater than zero.");
      return;
    }
    if (!Number.isFinite(currentOdometerKm) || currentOdometerKm < 0) {
      setError("Current odometer must be zero or greater.");
      return;
    }
    if (year !== null && (!Number.isInteger(year) || year < 1886 || year > new Date().getFullYear() + 1)) {
      setError("Enter a valid model year.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        name: form.name,
        type: form.type,
        makeModel: form.makeModel,
        plateNumber: form.plateNumber,
        year,
        defaultFuelGrade: form.defaultFuelGrade,
        tankCapacityLitres,
        currentOdometerKm
      });
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save vehicle.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      footer={<Button className="w-full" form="vehicle-form" loading={isSaving} size="lg" type="submit">{vehicle ? "Save Vehicle" : "Add Vehicle"}</Button>}
      onClose={onClose}
      open={open}
      title={vehicle ? "Edit Vehicle" : "Add Vehicle"}
    >
      <form className="grid gap-5 pb-2" id="vehicle-form" onSubmit={submit}>
        <div className="grid grid-cols-2 rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-800">
          {(["motorcycle", "car"] as const).map((type) => {
            const Icon = type === "motorcycle" ? Bike : CarFront;
            const selected = form.type === type;
            return (
              <button
                aria-pressed={selected}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${selected ? "bg-red-600 text-white shadow-crimson dark:bg-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
                key={type}
                onClick={() => update("type", type)}
                type="button"
              >
                <Icon aria-hidden="true" className="mr-2 inline size-4" strokeWidth={2} />
                {type === "motorcycle" ? "Motorcycle" : "Car"}
              </button>
            );
          })}
        </div>

        <Input label="Vehicle name" onChange={(event) => update("name", event.target.value)} placeholder="Night Runner" startAdornment={<Tag className="size-4" strokeWidth={2} />} value={form.name} />
        <Input label="Make / model" onChange={(event) => update("makeModel", event.target.value)} placeholder="Yamaha MT-15" startAdornment={form.type === "motorcycle" ? <Bike className="size-4" strokeWidth={2} /> : <CarFront className="size-4" strokeWidth={2} />} value={form.makeModel} />
        <div className="grid grid-cols-2 gap-3">
          <Input inputMode="numeric" label="Year" onChange={(event) => update("year", event.target.value)} placeholder="2024" type="number" value={form.year} />
          <Input label="Plate number" onChange={(event) => update("plateNumber", event.target.value)} placeholder="SLE 8404 K" startAdornment={<Hash className="size-4" strokeWidth={2} />} value={form.plateNumber} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input endAdornment="L" inputMode="decimal" label="Tank capacity" onChange={(event) => update("tankCapacityLitres", event.target.value)} placeholder={form.type === "car" ? "50" : "10"} type="number" value={form.tankCapacityLitres} />
          <Input endAdornment="km" inputMode="numeric" label="Current odometer" onChange={(event) => update("currentOdometerKm", event.target.value)} placeholder="0" startAdornment={<Gauge className="size-4" strokeWidth={2} />} type="number" value={form.currentOdometerKm} />
        </div>
        <Select label="Default fuel grade" onChange={(event) => update("defaultFuelGrade", event.target.value)} value={form.defaultFuelGrade}>
          <option>RON 92</option>
          <option>RON 95</option>
          <option>RON 98</option>
          <option>Diesel</option>
          <option>Electric</option>
        </Select>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <Fuel aria-hidden="true" className="size-4 text-red-500" strokeWidth={2} />
          Home currency is set to SGD for Slice 1.
        </div>
        {error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p> : null}
      </form>
    </BottomSheet>
  );
}
