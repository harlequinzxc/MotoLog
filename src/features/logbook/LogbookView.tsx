import { Fuel, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { formatLocalDateTime } from "@/lib/date";
import { formatEfficiency, formatVolume } from "@/lib/units";
import type { FuelLog, FuelLogInput } from "@/types";

export function LogbookView() {
  const { activeVehicle, deleteFuelLog, fuelLogs, restoreSnapshot, updateFuelLog } = useApp();
  const { showToast } = useToast(); const [editing, setEditing] = useState<FuelLog | undefined>(); const [open, setOpen] = useState(false);
  const logs = fuelLogs.filter((log) => log.vehicleId === activeVehicle?.id);
  const stations = fuelLogs.map((log) => log.stationName).filter(Boolean);
  const save = async (input: FuelLogInput) => { if (!editing) return; await updateFuelLog(editing.id, input); showToast({ message: "Fuel log updated.", tone: "success" }); };
  const remove = async (log: FuelLog) => { const snapshot = await deleteFuelLog(log.id); if (!snapshot) return; showToast({ actionLabel: "Undo", message: "Fuel log deleted.", onAction: () => restoreSnapshot(snapshot), tone: "success" }); };
  return <div className="grid gap-5"><div><p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">FILL-UP HISTORY</p><h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Logbook</h1></div>{logs.length === 0 ? <Card className="text-center"><Fuel aria-hidden="true" className="mx-auto size-8 text-red-500" strokeWidth={2} /><p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">No fill-ups yet</p><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Use the centered fuel button to add your first log.</p></Card> : <div className="grid gap-3">{logs.map((log) => <Card key={log.id}><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-red-500/10 text-red-500"><Fuel className="size-5" strokeWidth={2} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><p className="font-semibold text-zinc-900 dark:text-zinc-50">{formatLocalDateTime(log.occurredAt)} · {log.stationName || "Unknown station"}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{log.mode === "full" ? "Full tank" : log.mode === "partial" ? "Partial fill" : "Missed fill marker"} · {log.activeFuel}</p></div><p className="tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">{log.totalCost === null ? "—" : `${log.currencyCode} ${log.totalCost.toFixed(2)}`}</p></div><div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400"><span className="tabular-nums">{log.volumeLitres === null ? "—" : formatVolume(log.volumeLitres, activeVehicle?.volumeUnit ?? "liters")}</span><span className="tabular-nums">{log.pricePerLitre === null ? "—" : `${log.currencyCode} ${log.pricePerLitre.toFixed(2)}/L`}</span><span className="tabular-nums">{formatEfficiency(log.efficiencyKmPerLitre, activeVehicle?.consumptionUnit ?? "km-per-litre")}</span></div><div className="mt-3 flex gap-2"><Button onClick={() => { setEditing(log); setOpen(true); }} size="sm" variant="ghost"><Pencil className="size-4" strokeWidth={2} />Edit</Button><Button onClick={() => void remove(log)} size="sm" variant="danger"><Trash2 className="size-4" strokeWidth={2} />Delete</Button></div></div></div></Card>)}</div>}<FuelLogSheet activeFuelOptions={activeVehicle?.fuelType === "dual-fuel" ? ["petrol", "lpg"] : [activeVehicle?.fuelType === "lpg" ? "lpg" : activeVehicle?.fuelType === "diesel" ? "diesel" : "petrol"]} log={editing} onClose={() => setOpen(false)} onSubmit={save} open={open} stationSuggestions={stations} /></div>;
}
