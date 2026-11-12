import { Bike, CarFront, Fuel, Gauge } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Vehicle, VehicleInput, VehicleType } from "@/types";

interface VehicleFormSheetProps {
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  open: boolean;
  vehicle?: Vehicle;
}

interface FormState { name: string; type: VehicleType; tankCapacityLitres: string; currentOdometerKm: string }
const blank: FormState = { name: "", type: "motorcycle", tankCapacityLitres: "", currentOdometerKm: "" };
function fromVehicle(vehicle?: Vehicle): FormState { return vehicle ? { name: vehicle.name, type: vehicle.type, tankCapacityLitres: String(vehicle.tankCapacityLitres), currentOdometerKm: String(vehicle.currentOdometerKm) } : blank; }

export function VehicleFormSheet({ onClose, onSubmit, open, vehicle }: VehicleFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => fromVehicle(vehicle));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { if (open) { setForm(fromVehicle(vehicle)); setError(null); setIsSaving(false); } }, [open, vehicle]);
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tankCapacityLitres = Number(form.tankCapacityLitres);
    const currentOdometerKm = Number(form.currentOdometerKm);
    if (!form.name.trim()) return setError("Enter a vehicle name.");
    if (!Number.isFinite(tankCapacityLitres) || tankCapacityLitres <= 0) return setError("Tank capacity must be greater than zero.");
    if (!Number.isFinite(currentOdometerKm) || currentOdometerKm < 0) return setError("Current odometer must be zero or greater.");
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({ name: form.name, type: form.type, tankCapacityLitres, currentOdometerKm });
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save vehicle.");
    } finally { setIsSaving(false); }
  };

  return (
    <BottomSheet footer={<Button className="w-full" form="vehicle-form" loading={isSaving} size="lg" type="submit">{vehicle ? "Save Vehicle" : "Add Vehicle"}</Button>} onClose={onClose} open={open} title={vehicle ? "Edit Vehicle" : "Add Vehicle"}>
      <form className="grid gap-5 pb-2" id="vehicle-form" onSubmit={submit}>
        <div className="grid grid-cols-2 rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-800">
          {(["motorcycle", "car"] as const).map((type) => {
            const Icon = type === "motorcycle" ? Bike : CarFront;
            return <button aria-pressed={form.type === type} className={`min-h-[44px] rounded-xl text-sm font-semibold ${form.type === type ? "bg-red-600 text-white shadow-crimson dark:bg-red-500" : "text-zinc-500 dark:text-zinc-400"}`} key={type} onClick={() => update("type", type)} type="button"><Icon className="mr-2 inline size-4" strokeWidth={2} />{type === "motorcycle" ? "Motorcycle" : "Car"}</button>;
          })}
        </div>
        <Input label="Vehicle name" onChange={(event) => update("name", event.target.value)} placeholder={form.type === "motorcycle" ? "Yamaha MT-15" : "Honda Civic FD4"} startAdornment={form.type === "motorcycle" ? <Bike className="size-4" strokeWidth={2} /> : <CarFront className="size-4" strokeWidth={2} />} value={form.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input endAdornment="L" inputMode="decimal" label="Tank capacity" onChange={(event) => update("tankCapacityLitres", event.target.value)} placeholder={form.type === "motorcycle" ? "10" : "50"} startAdornment={<Fuel className="size-4" strokeWidth={2} />} type="number" value={form.tankCapacityLitres} />
          <Input endAdornment="km" inputMode="numeric" label="Current odometer" onChange={(event) => update("currentOdometerKm", event.target.value)} placeholder="0" startAdornment={<Gauge className="size-4" strokeWidth={2} />} type="number" value={form.currentOdometerKm} />
        </div>
        {error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p> : null}
      </form>
    </BottomSheet>
  );
}
