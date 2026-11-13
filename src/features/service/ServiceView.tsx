import { CirclePlus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ListGroup } from "@/components/ui/ListGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
    <div className="grid gap-6">
      <SectionHeader action={<div className="flex items-center gap-1"><Button onClick={() => setCustomOpen(true)} size="sm" variant="ghost">Custom</Button><Button onClick={() => { setEditing(undefined); setVisitOpen(true); }} size="sm"><CirclePlus className="size-4" strokeWidth={2} />Visit</Button></div>} eyebrow="MAINTENANCE" title="Service status" />
      <p className="-mt-3 text-sm text-zinc-500 dark:text-zinc-400">One receipt can update multiple maintenance items.</p>
      <ListGroup>
        {items.map((item, index) => {
          const latest = visits.filter((visit) => itemIdsForVisit(visit.id).includes(item.id))[0];
          const sinceKm = latest ? Math.max(activeVehicle.currentOdometerKm - latest.odometerKm, 0) : null;
          const sinceDays = latest ? Math.max(Math.floor((Date.now() - new Date(latest.occurredAt).getTime()) / 86_400_000), 0) : null;
          return (
            <div className={`motion-list-item flex items-start gap-3 px-4 py-4 ${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}`} data-motion="service-item" key={item.id}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-red-600 dark:bg-zinc-800 dark:text-red-400"><Wrench aria-hidden="true" className="size-4" strokeWidth={2} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                {latest ? <>
                  <p className="mt-1 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">{formatLocalDateTime(latest.occurredAt)} · {latest.odometerKm.toLocaleString()} km</p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300"><span className="tabular-nums">{sinceKm?.toLocaleString()} km since</span> · <span className="tabular-nums">{sinceDays} days</span> · Last <span className="tabular-nums">{latest.currencyCode} {latest.totalCost.toFixed(2)}</span></p>
                </> : <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">No service recorded.</p>}
              </div>
            </div>
          );
        })}
      </ListGroup>
      <ServiceVisitSheet currencyCode={activeVehicle.currencyCode} items={items} onClose={() => setVisitOpen(false)} onSubmit={saveVisit} open={visitOpen} visit={editing} visitItemIds={editing ? itemIdsForVisit(editing.id) : []} />
      <CustomServiceItemSheet onClose={() => setCustomOpen(false)} onSubmit={async (title) => { await addCustomServiceItem(title); showToast({ message: "Custom service item added.", tone: "success" }); }} open={customOpen} />
    </div>
  );
}
