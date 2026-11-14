import { CirclePlus, Wrench } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { SERVICE_CADENCE_LABELS, SERVICE_CADENCE_ORDER } from "@/data/serviceItems";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListGroup } from "@/components/ui/ListGroup";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";
import { CustomServiceItemSheet } from "@/features/service/CustomServiceItemSheet";
import { ServiceVisitSheet } from "@/features/service/ServiceVisitSheet";
import { formatLocalDateTime } from "@/lib/date";
import type { ServiceCadence, ServiceItem, ServiceVisit, ServiceVisitInput } from "@/types";

function cadenceRank(item: ServiceItem) {
  if (!item.cadence) return SERVICE_CADENCE_ORDER.length;
  return SERVICE_CADENCE_ORDER.indexOf(item.cadence);
}

function cadenceLabel(cadence: ServiceCadence | null | undefined) {
  return cadence ? SERVICE_CADENCE_LABELS[cadence] : "Custom items";
}

export function ServiceView() {
  const { activeVehicle, addCustomServiceItem, addServiceVisit, serviceItems, serviceVisitItems, serviceVisits, updateServiceVisit } = useApp();
  const { showToast } = useToast();
  const [visitOpen, setVisitOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceVisit | undefined>();
  const items = useMemo(() => serviceItems.filter((item) => item.vehicleId === activeVehicle?.id && !item.isArchived).sort((first, second) => cadenceRank(first) - cadenceRank(second) || first.title.localeCompare(second.title)), [activeVehicle?.id, serviceItems]);
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

  let previousCadence: ServiceCadence | null | undefined;

  return (
    <div className="grid gap-6">
      <SectionHeader action={<div className="flex items-center gap-1"><Button onClick={() => setCustomOpen(true)} size="sm" variant="ghost">Custom</Button><Button onClick={() => { setEditing(undefined); setVisitOpen(true); }} size="sm"><CirclePlus className="size-4" strokeWidth={2} />Visit</Button></div>} eyebrow={activeVehicle.type === "car" ? "CAR MAINTENANCE" : "MOTORCYCLE MAINTENANCE"} title="Service checklist" />
      <p className="-mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">General guidance for this vehicle type. Confirm fluid, tyre, and interval specifications in your owner’s manual.</p>
      <ListGroup>
        {items.length === 0 ? <EmptyState actionLabel="Add custom item" description="Add a checklist item for this vehicle to begin tracking maintenance." icon={Wrench} onAction={() => setCustomOpen(true)} title="No service items yet" /> : items.map((item, index) => {
          const cadence = item.cadence ?? null;
          const shouldStartSection = previousCadence !== cadence;
          previousCadence = cadence;
          const latest = visits.filter((visit) => itemIdsForVisit(visit.id).includes(item.id))[0];
          const sinceKm = latest ? Math.max(activeVehicle.currentOdometerKm - latest.odometerKm, 0) : null;
          const sinceDays = latest ? Math.max(Math.floor((Date.now() - new Date(latest.occurredAt).getTime()) / 86_400_000), 0) : null;
          return (
            <Fragment key={item.id}>
              {shouldStartSection ? <div className={`${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""} bg-zinc-50 px-4 py-3 dark:bg-zinc-950/50`}><p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{cadenceLabel(cadence).toUpperCase()}</p></div> : null}
              <div className="motion-list-item flex items-start gap-3 px-4 py-4" data-motion="service-item">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-red-600 dark:bg-zinc-800 dark:text-red-400"><Wrench aria-hidden="true" className="size-4" strokeWidth={2} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                  {item.schedule ? <p className="mt-1 tabular-nums text-xs font-semibold text-red-600 dark:text-red-400">{item.schedule}</p> : null}
                  {item.guidance ? <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.guidance}</p> : null}
                  {latest ? <p className="mt-2 tabular-nums text-xs text-zinc-500 dark:text-zinc-400">Last: {formatLocalDateTime(latest.occurredAt)} · {latest.odometerKm.toLocaleString()} km · {latest.currencyCode} {latest.totalCost.toFixed(2)} · {sinceKm?.toLocaleString()} km / {sinceDays} days since</p> : null}
                </div>
              </div>
            </Fragment>
          );
        })}
      </ListGroup>
      <ServiceVisitSheet currencyCode={activeVehicle.currencyCode} items={items} onClose={() => setVisitOpen(false)} onSubmit={saveVisit} open={visitOpen} visit={editing} visitItemIds={editing ? itemIdsForVisit(editing.id) : []} />
      <CustomServiceItemSheet onClose={() => setCustomOpen(false)} onSubmit={async (title) => { await addCustomServiceItem(title); showToast({ message: "Custom service item added.", tone: "success" }); }} open={customOpen} />
    </div>
  );
}
