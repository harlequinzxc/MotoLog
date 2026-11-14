import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, type AppTab } from "@/components/layout/BottomNav";

interface AppShellProps {
  activeTab: AppTab;
  children: ReactNode;
  onAddFuel: () => void;
  onSettings: () => void;
  onTabChange: (tab: AppTab) => void;
}

export function AppShell({ activeTab, children, onAddFuel, onSettings, onTabChange }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="app-nav-clearance mx-auto min-h-[100dvh] max-w-[480px]">
        <AppHeader onSettings={onSettings} />
        <main className="min-w-0 px-4 pb-6 sm:px-6">{children}</main>
      </div>
      <BottomNav activeTab={activeTab} onAddFuel={onAddFuel} onTabChange={onTabChange} />
    </div>
  );
}
