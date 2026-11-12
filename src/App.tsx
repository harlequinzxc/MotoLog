import { useState } from "react";

import { WhatsNewSheet } from "@/components/changelog/WhatsNewSheet";
import { AppShell } from "@/components/layout/AppShell";
import type { AppTab } from "@/components/layout/BottomNav";
import { ToastProvider, useToast } from "@/components/ui/ToastProvider";
import { AppProvider, useApp } from "@/context/AppProvider";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { GarageView } from "@/features/garage/GarageView";
import { VehicleFormSheet } from "@/features/garage/VehicleFormSheet";
import { LogbookView } from "@/features/logbook/LogbookView";
import { WelcomeCard } from "@/features/onboarding/WelcomeCard";
import { SettingsView } from "@/features/settings/SettingsView";
import type { FuelLogInput, VehicleInput } from "@/types";

function AppContent() {
  const { addFuelLog, createVehicle, error, isLoading, seedSampleData, vehicles } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AppTab>("dashboard");
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false);
  const [fuelSheetOpen, setFuelSheetOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try { await seedSampleData(); setTab("dashboard"); showToast({ message: "Sample vehicles and fill-ups added.", tone: "success" }); }
    catch (caughtError) { showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to seed sample data.", tone: "error" }); }
    finally { setSeeding(false); }
  };
  const saveVehicle = async (input: VehicleInput) => { await createVehicle(input); setTab("garage"); showToast({ message: "Vehicle added.", tone: "success" }); };
  const saveFuelLog = async (input: FuelLogInput) => { await addFuelLog(input); setTab("logbook"); showToast({ message: "Fuel log saved and efficiency recalculated.", tone: "success" }); };

  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 text-sm text-zinc-400">Loading offline garage…</div>;
  if (error) return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 p-6 text-center text-sm text-rose-300">{error}</div>;
  if (vehicles.length === 0) return <div className="min-h-[100dvh] overflow-x-hidden bg-zinc-950 px-4 pb-[env(safe-area-inset-bottom)] pt-[max(2rem,env(safe-area-inset-top))] text-zinc-50"><WelcomeCard isSeeding={seeding} onAddVehicle={() => setVehicleSheetOpen(true)} onSeedData={seed} /><VehicleFormSheet onClose={() => setVehicleSheetOpen(false)} onSubmit={saveVehicle} open={vehicleSheetOpen} /></div>;

  const content = tab === "dashboard" ? <DashboardView /> : tab === "logbook" ? <LogbookView /> : tab === "garage" ? <GarageView /> : <SettingsView />;
  return <><AppShell activeTab={tab} onAddFuel={() => setFuelSheetOpen(true)} onSettings={() => setTab("settings")} onTabChange={setTab}>{content}</AppShell><FuelLogSheet onClose={() => setFuelSheetOpen(false)} onSubmit={saveFuelLog} open={fuelSheetOpen} /><WhatsNewSheet /></>;
}

export default function App() { return <ToastProvider><AppProvider><AppContent /></AppProvider></ToastProvider>; }
