import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, type AppTab } from "@/components/layout/BottomNav";

interface AppShellProps {
  activeTab: AppTab;
  children: ReactNode;
  onAdd: () => void;
  onSettings: () => void;
  onTabChange: (tab: AppTab) => void;
}

export function AppShell({ activeTab, children, onAdd, onSettings, onTabChange }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto min-h-[100dvh] max-w-[480px] pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <AppHeader onSettings={onSettings} />
        <main className="px-4 pb-6 sm:px-6">{children}</main>
      </div>
      <BottomNav activeTab={activeTab} onAdd={onAdd} onTabChange={onTabChange} />
    </div>
  );
}
