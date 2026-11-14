import { Check, ChevronDown, Settings } from "lucide-react";
import { useState } from "react";

import { AppLogo } from "@/components/brand/AppLogo";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";

export function AppHeader({ onSettings }: { onSettings: () => void }) {
  const { activeVehicle, setActiveVehicle, vehicles } = useApp();
  const { showToast } = useToast();
  const [switching, setSwitching] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const chooseVehicle = async (id: string) => {
    if (!id || id === activeVehicle?.id || switching) {
      setPickerOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await setActiveVehicle(id);
      const vehicle = vehicles.find((item) => item.id === id);
      showToast({ message: vehicle ? `${vehicle.name} is now active.` : "Active vehicle updated.", tone: "success" });
      setPickerOpen(false);
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to switch vehicles.", tone: "error" });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <header className="safe-top flex items-center gap-3 px-4 pb-3 sm:px-6">
        <AppLogo size={40} />
        <button aria-expanded={pickerOpen} aria-haspopup="dialog" className="motion-press flex h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded-full border border-zinc-200 bg-white px-4 text-left text-sm font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50" data-motion="vehicle-picker" disabled={switching || vehicles.length === 0} onClick={() => setPickerOpen(true)} type="button">
          <span className="truncate">{activeVehicle?.name ?? "No vehicle selected"}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-zinc-500" strokeWidth={2} />
        </button>
        <Button aria-label="Open settings" className="!min-w-[44px] !px-0" onClick={onSettings} variant="ghost"><Settings className="size-5" strokeWidth={2} /></Button>
      </header>
      <BottomSheet onClose={() => setPickerOpen(false)} open={pickerOpen} title="Active vehicle">
        <div className="pb-4" role="listbox">
          {vehicles.map((vehicle, index) => {
            const selected = vehicle.id === activeVehicle?.id;
            return <button aria-selected={selected} className={`motion-press flex min-h-[60px] w-full items-center gap-3 px-1 py-3 text-left ${index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""} ${selected ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50"}`} disabled={switching} key={vehicle.id} onClick={() => void chooseVehicle(vehicle.id)} role="option" type="button"><span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-red-500 bg-red-500 text-white" : "border-zinc-300 dark:border-zinc-700"}`}>{selected ? <Check aria-hidden="true" className="size-3" strokeWidth={2} /> : null}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{vehicle.name}</span><span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{vehicle.type} · {vehicle.fuelType}</span></span></button>;
          })}
        </div>
      </BottomSheet>
    </>
  );
}
