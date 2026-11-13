import { Check, Wrench } from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";

import { SERVICE_CADENCE_LABELS, SERVICE_CADENCE_ORDER } from "@/data/serviceItems";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ListGroup } from "@/components/ui/ListGroup";
import { localDateTimeInputValue, localDateTimeToIso } from "@/lib/date";
import type { ServiceCadence, ServiceItem, ServiceVisit, ServiceVisitInput } from "@/types";

interface ServiceVisitSheetProps {
  currencyCode: string;
  items: ServiceItem[];
  onClose: () => void;
  onSubmit: (input: ServiceVisitInput) => Promise<void>;
  open: boolean;
  visit?: ServiceVisit;
  visitItemIds?: string[];
}

interface State {
  date: string;
  notes: string;
  odometer: string;
  selected: string[];
  totalCost: string;
}

function blank(): State {
  return { date: localDateTimeInputValue(), odometer: "", totalCost: "", notes: "", selected: [] };
}

function fromVisit(visit?: ServiceVisit, itemIds: string[] = []): State {
  return visit ? { date: localDateTimeInputValue(new Date(visit.occurredAt)), odometer: String(visit.odometerKm), totalCost: String(visit.totalCost), notes: visit.notes, selected: itemIds } : blank();
}

function cadenceRank(item: ServiceItem) {
  if (!item.cadence) return SERVICE_CADENCE_ORDER.length;
  return SERVICE_CADENCE_ORDER.indexOf(item.cadence);
}

function cadenceLabel(cadence: ServiceCadence | null | undefined) {
  return cadence ? SERVICE_CADENCE_LABELS[cadence] : "Custom items";
}

export function ServiceVisitSheet({ currencyCode, items, onClose, onSubmit, open, visit, visitItemIds }: ServiceVisitSheetProps) {
  const [state, setState] = useState<State>(() => fromVisit(visit, visitItemIds));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sortedItems = useMemo(() => [...items].sort((first, second) => cadenceRank(first) - cadenceRank(second) || first.title.localeCompare(second.title)), [items]);

  useEffect(() => {
    if (open) {
      setState(fromVisit(visit, visitItemIds));
      setError(null);
      setSaving(false);
    }
  }, [open, visit, visitItemIds]);

  const toggle = (id: string) => setState((current) => ({ ...current, selected: current.selected.includes(id) ? current.selected.filter((value) => value !== id) : [...current.selected, id] }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const odometerKm = Number(state.odometer);
    const totalCost = Number(state.totalCost);
    if (state.selected.length === 0) return setError("Select at least one service item.");
    if (!Number.isFinite(odometerKm) || odometerKm < 0) return setError("Enter a valid odometer.");
    if (!Number.isFinite(totalCost) || totalCost < 0) return setError("Enter a valid total cost.");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ occurredAt: localDateTimeToIso(state.date), odometerKm, totalCost, currencyCode, notes: state.notes, serviceItemIds: state.selected });
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save service visit.");
    } finally {
      setSaving(false);
    }
  };

  let previousCadence: ServiceCadence | null | undefined;

  return (
    <BottomSheet footer={<Button className="w-full" form="service-visit-form" loading={saving} size="lg" type="submit">{visit ? "Save Service Visit" : "Log Service Visit"}</Button>} onClose={onClose} open={open} title={visit ? "Edit Service Visit" : "Service Visit"}>
      <form className="grid gap-5 pb-2" id="service-visit-form" onSubmit={submit}>
        <Input label="Date and time" onChange={(event) => setState((current) => ({ ...current, date: event.target.value }))} type="datetime-local" value={state.date} />
        <div className="grid grid-cols-2 gap-3">
          <Input endAdornment="km" inputMode="numeric" label="Odometer" onChange={(event) => setState((current) => ({ ...current, odometer: event.target.value }))} type="number" value={state.odometer} />
          <Input endAdornment={currencyCode} inputMode="decimal" label="Total visit cost" onChange={(event) => setState((current) => ({ ...current, totalCost: event.target.value }))} startAdornment={<Wrench className="size-4" strokeWidth={2} />} type="number" value={state.totalCost} />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-400">Service items</p>
          <ListGroup className="mt-2">
            {sortedItems.map((item, index) => {
              const cadence = item.cadence ?? null;
              const startsSection = previousCadence !== cadence;
              previousCadence = cadence;
              const selected = state.selected.includes(item.id);
              return (
                <Fragment key={item.id}>
                  {startsSection ? <div className={`${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""} bg-zinc-50 px-3 py-2 dark:bg-zinc-950/50`}><p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{cadenceLabel(cadence).toUpperCase()}</p></div> : null}
                  <button aria-pressed={selected} className={`motion-press flex min-h-[52px] w-full items-center justify-between gap-3 px-3 py-3 text-left ${selected ? "bg-red-500/10 text-red-700 dark:text-red-300" : "text-zinc-700 dark:text-zinc-300"}`} data-motion="service-selector" onClick={() => toggle(item.id)} type="button">
                    <span className="min-w-0"><span className="block text-sm font-semibold">{item.title}</span>{item.schedule ? <span className="mt-1 block tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{item.schedule}</span> : null}</span>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-red-500 bg-red-500 text-white" : "border-zinc-300 dark:border-zinc-700"}`} aria-hidden="true">{selected ? <Check className="size-3" strokeWidth={2} /> : null}</span>
                  </button>
                </Fragment>
              );
            })}
          </ListGroup>
        </div>
        <Input label="Notes" onChange={(event) => setState((current) => ({ ...current, notes: event.target.value }))} placeholder="What was completed?" value={state.notes} />
        {error ? <p className="motion-list-item rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" data-motion="form-error">{error}</p> : null}
      </form>
    </BottomSheet>
  );
}
