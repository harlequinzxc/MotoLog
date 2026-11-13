import { CirclePlus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { CustomServiceItemSheet } from "@/features/service/CustomServiceItemSheet";
import { ServiceVisitSheet } from "@/features/service/ServiceVisitSheet";
import { formatLocalDateTime } from "@/lib/date";
import type { ServiceVisit, ServiceVisitInput } from "@/types";

export function ServiceView() {
  const { activeVehicle, addCustomServiceItem, addServiceVisit, serviceItems, serviceVisitItems, serviceVisits, updateServiceVisit } = useApp();
  const { showToast } = useToast();
  const [visitOpen, setVisitOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceVisit | undefined>();
  const items = useMemo(() => serviceItems.filter((item) => item.vehicleId === activeVehicle?.id), [activeVehicle?.id, serviceItems]);
  const visits = useMemo(() => serviceVisits.filter((visit) => visit.vehicleId === activeVehicle?.id), [activeVehicle?.id, serviceVisits]);
  const itemIdsForVisit = (visitId: string) => serviceVisitItems.filter((link) => link.visitId === visitId).map((link) => link.serviceItemId);
  const saveVisit = async (input: ServiceVisitInput) => {
    if (editing) {
      await updateServiceVisit(editing.id, input);
      showToast({ message: "Service visit updated.", tone: "success" });
    } else {
      await addServiceVisit(input);
      showToast({ message: "Service visit logged.", tone: "success" });
    }
  };

  if (!activeVehicle) return null;

  return (
    <div className="grid gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">MAINTENANCE</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Service tracker</h1>
        </div>
        <Button onClick={() => { setEditing(undefined); setVisitOpen(true); }} size="sm"><CirclePlus className="size-5" strokeWidth={2} />Visit</Button>
      </div>
      <div className="flex justify-end"><Button onClick={() => setCustomOpen(true)} size="sm" variant="ghost">Add custom item</Button></div>
      <div className="grid gap-3">
        {items.map((item) => {
          const latest = visits.filter((visit) => itemIdsForVisit(visit.id).includes(item.id))[0];
          const sinceKm = latest ? Math.max(activeVehicle.currentOdometerKm - latest.odometerKm, 0) : null;
          const sinceDays = latest ? Math.max(Math.floor((Date.now() - new Date(latest.occurredAt).getTime()) / 86_400_000), 0) : null;
          return (
            <Card className="motion-list-item" data-motion="service-item" key={item.id}>
              <div className="flex items-start gap-3">
                <Wrench aria-hidden="true" className="mt-0.5 size-5 text-red-500" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                  {latest ? <>
                    <p className="mt-1 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">Last service {formatLocalDateTime(latest.occurredAt)} · {latest.odometerKm.toLocaleString()} km</p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"><span className="tabular-nums">{sinceKm?.toLocaleString()} km</span> · <span className="tabular-nums">{sinceDays} days</span> since · Last cost <span className="tabular-nums">{latest.currencyCode} {latest.totalCost.toFixed(2)}</span></p>
                  </> : <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">No service visit recorded yet.</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <ServiceVisitSheet currencyCode={activeVehicle.currencyCode} items={items} onClose={() => setVisitOpen(false)} onSubmit={saveVisit} open={visitOpen} visit={editing} visitItemIds={editing ? itemIdsForVisit(editing.id) : []} />
      <CustomServiceItemSheet onClose={() => setCustomOpen(false)} onSubmit={async (title) => { await addCustomServiceItem(title); showToast({ message: "Custom service item added.", tone: "success" }); }} open={customOpen} />
    </div>
  );
}
