import { BarChart3, Wrench } from "lucide-react";
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
import { RecordSummaryView } from "@/features/shell/RecordSummaryView";
import type { FuelLogInput, VehicleInput } from "@/types";

function AppContent() {
  const { activeVehicle, addFuelLog, createVehicle, error, expenseRecords, isLoading, fuelLogs, seedSampleData, serviceRecords, vehicles } = useApp();
  const { showToast } = useToast(); const [tab, setTab] = useState<AppTab>("dashboard"), [vehicleOpen, setVehicleOpen] = useState(false), [fuelOpen, setFuelOpen] = useState(false), [seeding, setSeeding] = useState(false);
  const seed = async () => { setSeeding(true); try { await seedSampleData(); setTab("dashboard"); showToast({ message: "Sample data loaded.", tone: "success" }); } catch (caughtError) { showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to load sample data.", tone: "error" }); } finally { setSeeding(false); } };
  const saveVehicle = async (input: VehicleInput) => { await createVehicle(input); setTab("garage"); showToast({ message: "Vehicle added.", tone: "success" }); };
  const saveFuel = async (input: FuelLogInput) => { await addFuelLog(input); setTab("logbook"); showToast({ message: "Fuel log saved and mileage recalculated.", tone: "success" }); };
  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 text-sm text-zinc-400">Loading offline garage…</div>;
  if (error) return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 p-6 text-center text-sm text-rose-300">{error}</div>;
  if (vehicles.length === 0) return <div className="min-h-[100dvh] overflow-x-hidden bg-zinc-950 px-4 pb-[env(safe-area-inset-bottom)] pt-[max(2rem,env(safe-area-inset-top))] text-zinc-50"><WelcomeCard isSeeding={seeding} onAddVehicle={() => setVehicleOpen(true)} onSeedData={seed} /><VehicleFormSheet onClose={() => setVehicleOpen(false)} onSubmit={saveVehicle} open={vehicleOpen} /></div>;
  const activeFuelOptions = activeVehicle?.fuelType === "dual-fuel" ? ["petrol", "lpg"] as const : [activeVehicle?.fuelType === "lpg" ? "lpg" : activeVehicle?.fuelType === "diesel" ? "diesel" : "petrol"] as const;
  const pastStations = fuelLogs.map((log) => log.stationName).filter(Boolean);
  const serviceCount = serviceRecords.filter((record) => record.vehicleId === activeVehicle?.id).length;
  const expenseCount = expenseRecords.filter((record) => record.vehicleId === activeVehicle?.id).length;
  const content = tab === "dashboard" ? <DashboardView /> : tab === "logbook" ? <LogbookView /> : tab === "garage" ? <GarageView /> : tab === "service" ? <RecordSummaryView description={`${serviceCount} stored service ${serviceCount === 1 ? "record" : "records"} for the active vehicle. Creation and planning workflows arrive in Slice 2.`} icon={Wrench} title="Service" /> : tab === "reports" ? <RecordSummaryView description={`${expenseCount} stored expense ${expenseCount === 1 ? "record" : "records"} for the active vehicle. Reporting visualizations arrive in Slice 2.`} icon={BarChart3} title="Reports" /> : <SettingsView />;
  return <><AppShell activeTab={tab} onAddFuel={() => setFuelOpen(true)} onSettings={() => setTab("settings")} onTabChange={setTab}>{content}</AppShell><FuelLogSheet activeFuelOptions={[...activeFuelOptions]} onClose={() => setFuelOpen(false)} onSubmit={saveFuel} open={fuelOpen} stationSuggestions={pastStations} /><WhatsNewSheet /></>;
}
export default function App() { return <ToastProvider><AppProvider><AppContent /></AppProvider></ToastProvider>; }
