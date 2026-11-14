import { Bike, CarFront, Fuel, Gauge } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CURRENCIES } from "@/data/currencies";
import type { Vehicle, VehicleInput, VehicleType } from "@/types";

interface VehicleFormSheetProps {
  onClose: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  open: boolean;
  vehicle?: Vehicle;
}

interface FormState {
  consumptionUnit: VehicleInput["consumptionUnit"];
  currencyCode: string;
  currentOdometerKm: string;
  distanceUnit: VehicleInput["distanceUnit"];
  fuelType: VehicleInput["fuelType"];
  name: string;
  tankCapacityLitres: string;
  type: VehicleType;
  volumeUnit: VehicleInput["volumeUnit"];
}

const blank: FormState = { name: "", type: "motorcycle", fuelType: "petrol", tankCapacityLitres: "", currentOdometerKm: "", distanceUnit: "km", volumeUnit: "liters", consumptionUnit: "km-per-litre", currencyCode: "SGD" };

function fromVehicle(vehicle?: Vehicle): FormState {
  return vehicle ? { name: vehicle.name, type: vehicle.type, fuelType: vehicle.fuelType, tankCapacityLitres: String(vehicle.tankCapacityLitres), currentOdometerKm: String(vehicle.currentOdometerKm), distanceUnit: vehicle.distanceUnit, volumeUnit: vehicle.volumeUnit, consumptionUnit: vehicle.consumptionUnit, currencyCode: vehicle.currencyCode } : blank;
}

export function VehicleFormSheet({ onClose, onSubmit, open, vehicle }: VehicleFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => fromVehicle(vehicle));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(fromVehicle(vehicle));
      setError(null);
      setSaving(false);
    }
  }, [open, vehicle]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tankCapacityLitres = Number(form.tankCapacityLitres);
    const currentOdometerKm = Number(form.currentOdometerKm);
    if (!form.name.trim()) return setError("Enter a vehicle name.");
    if (!Number.isFinite(tankCapacityLitres) || tankCapacityLitres <= 0) return setError("Tank capacity must be greater than zero.");
    if (!Number.isFinite(currentOdometerKm) || currentOdometerKm < 0) return setError("Current odometer must be zero or greater.");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, name: form.name.trim(), tankCapacityLitres, currentOdometerKm });
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet footer={<Button className="w-full" form="vehicle-form" loading={saving} size="lg" type="submit">{vehicle ? "Save Vehicle" : "Add Vehicle"}</Button>} onClose={onClose} open={open} title={vehicle ? "Edit Vehicle" : "Add Vehicle"}>
      <form className="grid gap-5 pb-2" id="vehicle-form" onSubmit={submit}>
        <div className="grid grid-cols-2 rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-800">
          {(["motorcycle", "car"] as const).map((type) => {
            const Icon = type === "motorcycle" ? Bike : CarFront;
            return <button aria-pressed={form.type === type} className={`motion-press min-h-[44px] rounded-xl text-sm font-semibold ${form.type === type ? "bg-red-600 text-white dark:bg-red-500" : "text-zinc-500 dark:text-zinc-400"}`} data-motion="vehicle-type" key={type} onClick={() => update("type", type)} type="button"><Icon className="mr-2 inline size-4" strokeWidth={2} />{type === "motorcycle" ? "Motorcycle" : "Car"}</button>;
          })}
        </div>
        <Input label="Vehicle name" onChange={(event) => update("name", event.target.value)} placeholder={form.type === "motorcycle" ? "Yamaha MT-15" : "Honda Civic FD4"} startAdornment={form.type === "motorcycle" ? <Bike className="size-4" strokeWidth={2} /> : <CarFront className="size-4" strokeWidth={2} />} value={form.name} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input endAdornment="L" inputMode="decimal" label="Tank capacity" onChange={(event) => update("tankCapacityLitres", event.target.value)} placeholder={form.type === "motorcycle" ? "10" : "50"} startAdornment={<Fuel className="size-4" strokeWidth={2} />} type="number" value={form.tankCapacityLitres} />
          <Input endAdornment="km" inputMode="numeric" label="Current odometer" onChange={(event) => update("currentOdometerKm", event.target.value)} placeholder="0" startAdornment={<Gauge className="size-4" strokeWidth={2} />} type="number" value={form.currentOdometerKm} />
        </div>
        <Select label="Fuel type" onValueChange={(value) => update("fuelType", value as FormState["fuelType"])} value={form.fuelType}><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="lpg">LPG</option><option value="dual-fuel">Dual-Fuel</option></Select>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Distance" onValueChange={(value) => update("distanceUnit", value as FormState["distanceUnit"])} value={form.distanceUnit}><option value="km">Kilometres</option><option value="miles">Miles</option></Select>
          <Select label="Volume" onValueChange={(value) => update("volumeUnit", value as FormState["volumeUnit"])} value={form.volumeUnit}><option value="liters">Liters</option><option value="gallons">Gallons</option></Select>
        </div>
        <Select label="Consumption" onValueChange={(value) => update("consumptionUnit", value as FormState["consumptionUnit"])} value={form.consumptionUnit}><option value="km-per-litre">km/L</option><option value="litres-per-100km">L/100km</option><option value="mpg-us">MPG US</option><option value="mpg-uk">MPG UK</option></Select>
        <Select label="Currency" onValueChange={(value) => update("currencyCode", value)} value={form.currencyCode}>{CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.label}</option>)}</Select>
        {error ? <p className="motion-list-item rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" data-motion="form-error">{error}</p> : null}
      </form>
    </BottomSheet>
  );
}
