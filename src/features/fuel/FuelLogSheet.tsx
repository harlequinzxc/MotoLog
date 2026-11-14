import { Calculator, Fuel, Gauge, MapPin } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CURRENCIES } from "@/data/currencies";
import { localDateTimeInputValue, localDateTimeToIso } from "@/lib/date";
import { calculateThirdField } from "@/utils/fuelMath";
import type { ActiveFuel, FillUpMode, FuelLog, FuelLogInput } from "@/types";

interface FuelLogSheetProps {
  activeFuelOptions: ActiveFuel[];
  log?: FuelLog;
  onClose: () => void;
  onSubmit: (input: FuelLogInput) => Promise<void>;
  open: boolean;
  stationSuggestions: string[];
}

type LockedField = "price" | "volume" | "total";

interface FormState {
  activeFuel: ActiveFuel;
  currencyCode: string;
  date: string;
  lastEdited: LockedField;
  locked: LockedField;
  mode: FillUpMode;
  notes: string;
  odometerKm: string;
  pricePerUnit: string;
  stationName: string;
  totalCost: string;
  volume: string;
}

function blank(activeFuel: ActiveFuel): FormState {
  return { date: localDateTimeInputValue(), odometerKm: "", pricePerUnit: "", volume: "", totalCost: "", currencyCode: "SGD", stationName: "Shell", mode: "full", activeFuel, notes: "", locked: "price", lastEdited: "volume" };
}

function fromLog(log: FuelLog | undefined, activeFuel: ActiveFuel): FormState {
  return log ? { date: localDateTimeInputValue(new Date(log.occurredAt)), odometerKm: String(log.odometerKm), pricePerUnit: log.pricePerLitre?.toFixed(2) ?? "", volume: log.volumeLitres?.toFixed(2) ?? "", totalCost: log.totalCost?.toFixed(2) ?? "", currencyCode: log.currencyCode, stationName: log.stationName, mode: log.mode, activeFuel: log.activeFuel, notes: log.notes, locked: "price", lastEdited: "volume" } : blank(activeFuel);
}

function parse(value: string) {
  const number = Number(value);
  return value.trim() && Number.isFinite(number) ? number : null;
}

export function FuelLogSheet({ activeFuelOptions, log, onClose, onSubmit, open, stationSuggestions }: FuelLogSheetProps) {
  const [form, setForm] = useState<FormState>(() => fromLog(log, activeFuelOptions[0]));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(fromLog(log, activeFuelOptions[0]));
      setError(null);
      setSaving(false);
    }
  }, [activeFuelOptions, log, open]);

  const fieldValue = (state: FormState, field: LockedField) => field === "price" ? parse(state.pricePerUnit) : field === "volume" ? parse(state.volume) : parse(state.totalCost);
  const editFinancial = (field: LockedField, value: string) => {
    setForm((current) => {
      const next = { ...current, [field === "price" ? "pricePerUnit" : field === "volume" ? "volume" : "totalCost"]: value, lastEdited: field };
      if (next.mode === "missed") return next;
      const price = fieldValue(next, "price");
      const volume = fieldValue(next, "volume");
      const total = fieldValue(next, "total");
      const target: LockedField | null = price === null ? "price" : volume === null ? "volume" : total === null ? "total" : (["price", "volume", "total"] as LockedField[]).find((candidate) => candidate !== next.locked && candidate !== field) ?? null;
      if (!target) return next;
      const calculated = calculateThirdField(price, volume, total, target);
      if (calculated === null) return next;
      const formatted = calculated.toFixed(2);
      return target === "price" ? { ...next, pricePerUnit: formatted } : target === "volume" ? { ...next, volume: formatted } : { ...next, totalCost: formatted };
    });
  };
  const price = useMemo(() => parse(form.pricePerUnit), [form.pricePerUnit]);
  const volume = useMemo(() => parse(form.volume), [form.volume]);
  const total = useMemo(() => parse(form.totalCost), [form.totalCost]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const odometerKm = parse(form.odometerKm);
    if (odometerKm === null || odometerKm < 0) return setError("Enter a valid odometer.");
    if (form.mode !== "missed" && (price === null || volume === null || total === null || volume <= 0 || total < 0)) return setError("Enter two valid fuel values so the third can be calculated.");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ occurredAt: localDateTimeToIso(form.date), odometerKm, activeFuel: form.activeFuel, mode: form.mode, pricePerLitre: form.mode === "missed" ? null : price, volumeLitres: form.mode === "missed" ? null : volume, totalCost: form.mode === "missed" ? null : total, currencyCode: form.currencyCode, stationName: form.stationName, notes: form.notes });
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save fuel log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet footer={<Button className="w-full" form="fuel-form" loading={saving} size="lg" type="submit">{log ? "Save Fill-Up" : "Log Fill-Up"}</Button>} onClose={onClose} open={open} title={log ? "Edit Fill-Up" : "Quick Fuel Log"}>
      <form className="grid gap-5 pb-2" id="fuel-form" onSubmit={submit}>
        <Input label="Date and time" onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="datetime-local" value={form.date} />
        <Input endAdornment="km" inputMode="numeric" label="Odometer" onChange={(event) => setForm((current) => ({ ...current, odometerKm: event.target.value }))} startAdornment={<Gauge className="size-4" strokeWidth={2} />} type="number" value={form.odometerKm} />
        <Select label="Fill-up mode" onValueChange={(value) => setForm((current) => ({ ...current, mode: value as FillUpMode }))} value={form.mode}>
          <option value="full">Full Tank</option><option value="partial">Partial Fill-Up</option><option value="missed">Missed a Fill-Up</option>
        </Select>
        <div className="motion-chart-enter" data-motion="fuel-mode" key={form.mode}>
          {form.mode === "missed" ? <p className="motion-list-item rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" data-motion="fuel-mode-help">This marker resets the efficiency baseline at its odometer reading. No cost or fuel volume is required.</p> : (
            <div className="grid gap-5">
              <Select label="Lock calculation field" onValueChange={(value) => setForm((current) => ({ ...current, locked: value as LockedField }))} value={form.locked}>
                <option value="price">Lock Price / Unit</option><option value="volume">Lock Volume</option><option value="total">Lock Total Cost</option>
              </Select>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input inputMode="decimal" label="Price / unit" onChange={(event) => editFinancial("price", event.target.value)} startAdornment={<Calculator className="size-4" strokeWidth={2} />} type="number" value={form.pricePerUnit} />
                <Input inputMode="decimal" label="Volume" onChange={(event) => editFinancial("volume", event.target.value)} startAdornment={<Fuel className="size-4" strokeWidth={2} />} type="number" value={form.volume} />
                <Input inputMode="decimal" label="Total cost" onChange={(event) => editFinancial("total", event.target.value)} type="number" value={form.totalCost} />
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Active fuel" onValueChange={(value) => setForm((current) => ({ ...current, activeFuel: value as ActiveFuel }))} value={form.activeFuel}>{activeFuelOptions.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}</Select>
          <Select label="Currency" onValueChange={(value) => setForm((current) => ({ ...current, currencyCode: value }))} value={form.currencyCode}>{CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.label}</option>)}</Select>
        </div>
        <Input label="Station" onChange={(event) => setForm((current) => ({ ...current, stationName: event.target.value }))} placeholder={stationSuggestions[0] ?? "Shell"} startAdornment={<MapPin className="size-4" strokeWidth={2} />} value={form.stationName} />
        <Input label="Notes" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional note" value={form.notes} />
        {error ? <p className="motion-list-item rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" data-motion="form-error">{error}</p> : null}
      </form>
    </BottomSheet>
  );
}
