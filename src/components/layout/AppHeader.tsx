import { ChevronDown, Settings } from "lucide-react";
import { useState } from "react";

import { AppLogo } from "@/components/brand/AppLogo";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useApp } from "@/context/AppProvider";

export function AppHeader({ onSettings }: { onSettings: () => void }) {
  const { activeVehicle, setActiveVehicle, vehicles } = useApp();
  const { showToast } = useToast();
  const [switching, setSwitching] = useState(false);

  const chooseVehicle = async (id: string) => {
    if (!id || id === activeVehicle?.id || switching) return;
    setSwitching(true);
    try {
      await setActiveVehicle(id);
      const vehicle = vehicles.find((item) => item.id === id);
      showToast({ message: vehicle ? `${vehicle.name} is now active.` : "Active vehicle updated.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to switch vehicles.", tone: "error" });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="flex items-center gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <AppLogo size={40} />
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Active vehicle</span>
        <select className="h-11 w-full appearance-none rounded-full border border-zinc-200 bg-white py-0 pl-4 pr-9 text-sm font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50" disabled={switching || vehicles.length === 0} onChange={(event) => void chooseVehicle(event.target.value)} value={activeVehicle?.id ?? ""}>
          {vehicles.length === 0 ? <option value="">No vehicle selected</option> : null}
          {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
      </label>
      <Button aria-label="Open settings" className="!min-w-[44px] !px-0" onClick={onSettings} variant="ghost"><Settings className="size-5" strokeWidth={2} /></Button>
    </header>
  );
}
