import { Calculator, Fuel, Gauge, MapPin } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { localDateInputValue, localDateToIso } from "@/lib/date";
import { calculatePricePerLitre } from "@/utils/fuelMath";
import type { FuelLog, FuelLogInput } from "@/types";

interface FuelLogSheetProps { log?: FuelLog; onClose: () => void; onSubmit: (input: FuelLogInput) => Promise<void>; open: boolean }
interface FormState { date: string; odometerKm: string; litres: string; totalCost: string; currencyCode: "SGD" | "MYR"; station: string; isPartial: boolean; notes: string }
const stations = ["Shell", "Esso", "SPC", "Caltex", "Sinopec", "Petronas", "Other"] as const;
const blank = (): FormState => ({ date: localDateInputValue(), odometerKm: "", litres: "", totalCost: "", currencyCode: "SGD", station: "Shell", isPartial: false, notes: "" });
function fromLog(log?: FuelLog): FormState { return log ? { date: localDateInputValue(new Date(log.occurredAt)), odometerKm: String(log.odometerKm), litres: String(log.litres), totalCost: String(log.totalCost), currencyCode: log.currencyCode, station: log.station, isPartial: log.isPartial, notes: log.notes } : blank(); }

export function FuelLogSheet({ log, onClose, onSubmit, open }: FuelLogSheetProps) {
  const [form, setForm] = useState<FormState>(() => fromLog(log));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setForm(fromLog(log)); setError(null); setSaving(false); } }, [open, log]);
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const price = useMemo(() => calculatePricePerLitre(Number(form.totalCost), Number(form.litres)), [form.litres, form.totalCost]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const odometerKm = Number(form.odometerKm);
    const litres = Number(form.litres);
    const totalCost = Number(form.totalCost);
    if (!Number.isFinite(odometerKm) || odometerKm < 0) return setError("Enter a valid odometer.");
    if (!Number.isFinite(litres) || litres <= 0) return setError("Litres must be greater than zero.");
    if (!Number.isFinite(totalCost) || totalCost < 0) return setError("Enter a valid cost.");
    setSaving(true); setError(null);
    try { await onSubmit({ occurredAt: localDateToIso(form.date), odometerKm, litres, totalCost, currencyCode: form.currencyCode, station: form.station, isPartial: form.isPartial, notes: form.notes }); onClose(); }
    catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Unable to save fuel log."); }
    finally { setSaving(false); }
  };

  return <BottomSheet footer={<Button className="w-full" form="fuel-form" loading={saving} size="lg" type="submit">{log ? "Save Fill-Up" : "Log Fill-Up"}</Button>} onClose={onClose} open={open} title={log ? "Edit Fill-Up" : "Quick Fuel Log"}><form className="grid gap-5 pb-2" id="fuel-form" onSubmit={submit}><Input label="Date" onChange={(event) => update("date", event.target.value)} type="date" value={form.date} /><Input endAdornment="km" inputMode="numeric" label="Odometer" onChange={(event) => update("odometerKm", event.target.value)} startAdornment={<Gauge className="size-4" strokeWidth={2} />} type="number" value={form.odometerKm} /><div className="grid grid-cols-2 gap-3"><Input endAdornment="L" inputMode="decimal" label="Litres" onChange={(event) => update("litres", event.target.value)} startAdornment={<Fuel className="size-4" strokeWidth={2} />} type="number" value={form.litres} /><Input endAdornment={form.currencyCode} inputMode="decimal" label="Total cost" onChange={(event) => update("totalCost", event.target.value)} startAdornment={<Calculator className="size-4" strokeWidth={2} />} type="number" value={form.totalCost} /></div><p className="rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Price/L: <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{price === null ? "—" : `${form.currencyCode === "SGD" ? "S$" : "RM"}${price.toFixed(2)}`}</span></p><div className="grid grid-cols-2 gap-3"><Select label="Station" onChange={(event) => update("station", event.target.value)} value={form.station}>{stations.map((station) => <option key={station}>{station}</option>)}</Select><Select label="Currency" onChange={(event) => update("currencyCode", event.target.value as "SGD" | "MYR")} value={form.currencyCode}><option value="SGD">SGD</option><option value="MYR">MYR</option></Select></div><div className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-3 dark:bg-zinc-800"><MapPin aria-hidden="true" className="size-5 text-red-500" strokeWidth={2} /><div className="flex-1"><p className="font-semibold text-zinc-900 dark:text-zinc-50">Partial fill-up</p><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Partial fuel accumulates until the next full tank.</p></div><Toggle checked={form.isPartial} label="Toggle partial fill-up" onChange={(value) => update("isPartial", value)} /></div><Input label="Notes" onChange={(event) => update("notes", event.target.value)} placeholder="Optional note" value={form.notes} />{error ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p> : null}</form></BottomSheet>;
}
