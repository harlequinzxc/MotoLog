import { Fuel, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { formatLocalDate } from "@/lib/date";
import { displayEfficiency } from "@/utils/fuelMath";
import type { FuelLog, FuelLogInput } from "@/types";

export function LogbookView() {
  const { activeVehicle, deleteFuelLog, fuelLogs, restoreSnapshot, settings, updateFuelLog } = useApp();
  const { showToast } = useToast();
  const [editingLog, setEditingLog] = useState<FuelLog | undefined>();
  const [open, setOpen] = useState(false);
  const logs = fuelLogs.filter((log) => log.vehicleId === activeVehicle?.id);

  const save = async (input: FuelLogInput) => {
    if (!editingLog) return;
    await updateFuelLog(editingLog.id, input);
    showToast({ message: "Fuel log updated.", tone: "success" });
  };
  const remove = async (log: FuelLog) => {
    const snapshot = await deleteFuelLog(log.id);
    if (!snapshot) return;
    showToast({ actionLabel: "Undo", message: "Fuel log deleted.", onAction: () => restoreSnapshot(snapshot), tone: "success" });
  };

  return <div className="grid gap-5"><div><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">FILL-UP HISTORY</p><h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Logbook</h1></div>{logs.length === 0 ? <Card className="text-center"><Fuel aria-hidden="true" className="mx-auto size-8 text-red-500" strokeWidth={2} /><p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">No fill-ups yet</p><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Use the fuel button to add your first fill-up.</p></Card> : <div className="grid gap-3">{logs.map((log) => <Card key={log.id}><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-red-500/10 text-red-500"><Fuel className="size-5" strokeWidth={2} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><p className="font-semibold text-zinc-900 dark:text-zinc-50">{formatLocalDate(log.occurredAt)} · {log.station}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{log.isPartial ? "Partial fill" : "Full tank"} · {log.currencyCode}</p></div><p className="tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">{log.currencyCode === "SGD" ? "S$" : "RM"}{log.totalCost.toFixed(2)}</p></div><div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400"><span className="tabular-nums">{log.litres.toFixed(2)} L</span><span className="tabular-nums">{log.pricePerLitre === null ? "—" : `${log.currencyCode === "SGD" ? "S$" : "RM"}${log.pricePerLitre.toFixed(2)}/L`}</span><span className="tabular-nums">{displayEfficiency(log.efficiencyKmPerLitre, settings?.efficiencyUnit ?? "km-per-litre")}</span></div><div className="mt-3 flex gap-2"><Button onClick={() => { setEditingLog(log); setOpen(true); }} size="sm" variant="ghost"><Pencil className="size-4" strokeWidth={2} />Edit</Button><Button onClick={() => void remove(log)} size="sm" variant="danger"><Trash2 className="size-4" strokeWidth={2} />Delete</Button></div></div></div></Card>)}</div>}<FuelLogSheet log={editingLog} onClose={() => setOpen(false)} onSubmit={save} open={open} /></div>;
}
