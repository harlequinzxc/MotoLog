import { BookOpen, Wrench } from "lucide-react";
import { useState } from "react";

import { WhatsNewSheet } from "@/components/changelog/WhatsNewSheet";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ToastProvider, useToast } from "@/components/ui/ToastProvider";
import { AppProvider, useApp } from "@/context/AppProvider";
import { GarageView } from "@/features/garage/GarageView";
import { VehicleFormSheet } from "@/features/garage/VehicleFormSheet";
import { WelcomeCard } from "@/features/onboarding/WelcomeCard";
import { PlaceholderView } from "@/features/shell/PlaceholderView";
import { SettingsView } from "@/features/settings/SettingsView";
import type { AppTab } from "@/components/layout/BottomNav";
import type { VehicleInput } from "@/types";

function DashboardView() {
  const { activeVehicle, fixedCosts } = useApp();
  if (!activeVehicle) return null;
  const vehicleCostCount = fixedCosts.filter((cost) => cost.vehicleId === activeVehicle.id).length;
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">DASHBOARD</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.name}</h1>
      </div>
      <Card>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">CURRENT ODOMETER</p>
        <p className="mt-2 tabular-nums text-4xl font-semibold text-zinc-900 dark:text-zinc-50">{activeVehicle.currentOdometerKm.toLocaleString()} km</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{activeVehicle.makeModel} · {activeVehicle.defaultFuelGrade} · {activeVehicle.tankCapacityLitres} L tank</p>
      </Card>
      <Card>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">OWNERSHIP TRACKER</p>
        <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{vehicleCostCount} recurring costs tracked</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Fuel analytics, trip margins, and renewal summaries arrive in the next slice.</p>
      </Card>
    </div>
  );
}

function AppContent() {
  const { createVehicle, error, isLoading, seedSampleData, vehicles } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AppTab>("dashboard");
  const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const openVehicleForm = () => setIsVehicleSheetOpen(true);
  const seed = async () => {
    setIsSeeding(true);
    try {
      await seedSampleData();
      setTab("dashboard");
      showToast({ message: "Sample vehicles and three months of logs added.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to add sample data.", tone: "error" });
    } finally {
      setIsSeeding(false);
    }
  };

  const saveFirstVehicle = async (input: VehicleInput) => {
    await createVehicle(input);
    setTab("garage");
    showToast({ message: "Vehicle and service schedules added.", tone: "success" });
  };

  if (isLoading) {
    return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 text-sm text-zinc-400">Loading your offline garage…</div>;
  }

  if (error) {
    return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 p-6 text-center text-sm text-rose-300">{error}</div>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 px-4 pb-[env(safe-area-inset-bottom)] pt-[max(2rem,env(safe-area-inset-top))] text-zinc-50">
        <WelcomeCard isSeeding={isSeeding} onAddVehicle={openVehicleForm} onSeedData={seed} />
        <VehicleFormSheet onClose={() => setIsVehicleSheetOpen(false)} onSubmit={saveFirstVehicle} open={isVehicleSheetOpen} />
      </div>
    );
  }

  const content = tab === "dashboard"
    ? <DashboardView />
    : tab === "garage"
      ? <GarageView />
      : tab === "logbook"
        ? <PlaceholderView description="Fuel logs and cross-border cost tracking will be available in Slice 2." icon={BookOpen} title="Logbook" />
        : tab === "maintenance"
          ? <PlaceholderView description="Your seeded service presets are saved locally and will become an actionable maintenance planner in Slice 2." icon={Wrench} title="Maintenance" />
          : <SettingsView />;

  return (
    <>
      <AppShell
        activeTab={tab}
        onAdd={() => { setTab("garage"); }}
        onSettings={() => setTab("settings")}
        onTabChange={setTab}
      >
        {content}
      </AppShell>
      <WhatsNewSheet />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}
