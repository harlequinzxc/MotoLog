import { BookOpen, CirclePlus, Gauge, Warehouse } from "lucide-react";
import { cn } from "@/lib/cn";

export type AppTab = "dashboard" | "garage" | "logbook" | "settings";
interface BottomNavProps { activeTab: AppTab; onAddFuel: () => void; onTabChange: (tab: AppTab) => void }
const items: Array<{ icon: typeof Gauge; label: string; tab: AppTab }> = [{ icon: Gauge, label: "Dashboard", tab: "dashboard" }, { icon: BookOpen, label: "Logbook", tab: "logbook" }, { icon: Warehouse, label: "Garage", tab: "garage" }];

export function BottomNav({ activeTab, onAddFuel, onTabChange }: BottomNavProps) {
  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-zinc-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"><div className="relative mx-auto grid h-[72px] max-w-[480px] grid-cols-4">{items.slice(0, 2).map(({ icon: Icon, label, tab }) => <button className={cn("flex min-h-[44px] flex-col items-center justify-center gap-1 text-[10px] font-medium", activeTab === tab ? "text-red-600 dark:text-red-500" : "text-zinc-500 dark:text-zinc-400")} key={tab} onClick={() => onTabChange(tab)} type="button"><Icon className="size-5" strokeWidth={2} />{label}</button>)}<div className="relative flex items-center justify-center"><button aria-label="Log a fuel fill-up" className="absolute -top-6 grid size-14 place-items-center rounded-2xl bg-red-600 text-white shadow-crimson transition-transform hover:-translate-y-0.5 dark:bg-red-500" onClick={onAddFuel} type="button"><CirclePlus className="size-6" strokeWidth={2} /></button></div>{items.slice(2).map(({ icon: Icon, label, tab }) => <button className={cn("flex min-h-[44px] flex-col items-center justify-center gap-1 text-[10px] font-medium", activeTab === tab ? "text-red-600 dark:text-red-500" : "text-zinc-500 dark:text-zinc-400")} key={tab} onClick={() => onTabChange(tab)} type="button"><Icon className="size-5" strokeWidth={2} />{label}</button>)}</div></nav>;
}
