import { ChevronDown, Settings } from "lucide-react";

import { AppLogo } from "@/components/brand/AppLogo";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppProvider";

interface AppHeaderProps {
  onSettings: () => void;
}

export function AppHeader({ onSettings }: AppHeaderProps) {
  const { activeVehicle, setActiveVehicle, vehicles } = useApp();
  return (
    <header className="flex items-center gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <AppLogo className="size-10 shrink-0 rounded-xl shadow-crimson" />
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Active vehicle</span>
        <select
          className="h-11 w-full appearance-none rounded-full border border-zinc-200 bg-white py-0 pl-4 pr-9 text-sm font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          disabled={vehicles.length === 0}
          onChange={(event) => void setActiveVehicle(event.target.value)}
          value={activeVehicle?.id ?? ""}
        >
          {vehicles.length === 0 ? <option value="">No vehicle selected</option> : null}
          {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
      </label>
      <Button aria-label="Open settings" className="!min-w-[44px] !px-0" onClick={onSettings} variant="ghost">
        <Settings className="size-5" strokeWidth={2} />
      </Button>
    </header>
  );
}
