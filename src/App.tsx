import { AlertTriangle, LoaderCircle } from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { WhatsNewSheet } from "@/components/changelog/WhatsNewSheet";
import { AppShell } from "@/components/layout/AppShell";
import type { AppTab } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/ToastProvider";
import { AppProvider, useApp } from "@/context/AppProvider";
import { QuickActionSheet, type QuickAction } from "@/features/actions/QuickActionSheet";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { ExpenseSheet } from "@/features/expenses/ExpenseSheet";
import { FuelLogSheet } from "@/features/fuel/FuelLogSheet";
import { GarageView } from "@/features/garage/GarageView";
import { VehicleFormSheet } from "@/features/garage/VehicleFormSheet";
import { LogbookView } from "@/features/logbook/LogbookView";
import { WelcomeCard } from "@/features/onboarding/WelcomeCard";
import { ServiceVisitSheet } from "@/features/service/ServiceVisitSheet";
import { ServiceView } from "@/features/service/ServiceView";
import { SettingsView } from "@/features/settings/SettingsView";
import type { ActiveFuel, ExpenseInput, FuelLogInput, ServiceVisitInput, Vehicle, VehicleInput } from "@/types";

const ReportsView = lazy(() => import("@/features/reports/ReportsView").then(({ ReportsView: View }) => ({ default: View })));

function activeFuelOptionsFor(vehicle: Vehicle): ActiveFuel[] {
  if (vehicle.fuelType === "dual-fuel") return ["petrol", "lpg"];
  if (vehicle.fuelType === "lpg") return ["lpg"];
  if (vehicle.fuelType === "diesel") return ["diesel"];
  return ["petrol"];
}

function AppContent() {
  const {
    activeVehicle,
    addExpense,
    addFuelLog,
    addServiceVisit,
    createVehicle,
    error,
    fuelLogs,
    isLoading,
    refresh,
    seedSampleData,
    serviceItems,
    vehicles
  } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AppTab>("dashboard");
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await seedSampleData();
      setTab("dashboard");
      showToast({ message: "Sample data loaded.", tone: "success" });
    } catch (caughtError) {
      showToast({ message: caughtError instanceof Error ? caughtError.message : "Unable to seed sample data.", tone: "error" });
    } finally {
      setSeeding(false);
    }
  };

  const saveVehicle = async (input: VehicleInput) => {
    await createVehicle(input);
    setTab("garage");
    showToast({ message: "Vehicle added.", tone: "success" });
  };

  const saveFuel = async (input: FuelLogInput) => {
    await addFuelLog(input);
    setTab("logbook");
    showToast({ message: "Fuel log saved and mileage recalculated.", tone: "success" });
  };

  const saveExpense = async (input: ExpenseInput) => {
    await addExpense(input);
    setTab("logbook");
    showToast({ message: "Expense saved.", tone: "success" });
  };

  const saveService = async (input: ServiceVisitInput) => {
    await addServiceVisit(input);
    setTab("service");
    showToast({ message: "Service visit saved.", tone: "success" });
  };

  if (isLoading) {
    return <div className="grid min-h-[100dvh] place-items-center bg-zinc-950 text-sm text-zinc-400"><span className="inline-flex items-center gap-2"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" data-motion="spinner" strokeWidth={2} />Loading offline garage…</span></div>;
  }

  if (error) {
    return (
      <div className="motion-chart-enter grid min-h-[100dvh] place-items-center bg-zinc-950 p-6 text-center text-zinc-50" data-motion="app-error">
        <div className="max-w-sm">
          <AlertTriangle aria-hidden="true" className="mx-auto size-8 text-rose-400" strokeWidth={2} />
          <p className="mt-4 text-sm leading-6 text-rose-200">{error}</p>
          <Button className="mt-5" loading={retrying} onClick={() => void retry()} variant="secondary">Try Again</Button>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="safe-onboarding-top min-h-[100dvh] overflow-x-hidden bg-zinc-950 px-4 pb-[var(--safe-area-bottom)] text-zinc-50">
        <WelcomeCard isSeeding={seeding} onAddVehicle={() => setVehicleOpen(true)} onSeedData={seed} />
        <VehicleFormSheet onClose={() => setVehicleOpen(false)} onSubmit={saveVehicle} open={vehicleOpen} />
        <WhatsNewSheet />
      </div>
    );
  }

  if (!activeVehicle) return null;

  const activeFuelOptions = activeFuelOptionsFor(activeVehicle);
  const stations = fuelLogs.map((log) => log.stationName).filter(Boolean);
  const activeItems = serviceItems.filter((item) => item.vehicleId === activeVehicle.id);
  const choose = (action: QuickAction) => {
    if (action === "fuel") setFuelOpen(true);
    if (action === "service") setServiceOpen(true);
    if (action === "expense") setExpenseOpen(true);
  };
  const content = tab === "dashboard" ? <DashboardView />
    : tab === "logbook" ? <LogbookView />
      : tab === "garage" ? <GarageView />
        : tab === "service" ? <ServiceView />
          : tab === "reports" ? <Suspense fallback={<div className="grid min-h-[240px] place-items-center text-sm text-zinc-500 dark:text-zinc-400">Loading reports…</div>}><ReportsView /></Suspense>
            : <SettingsView onOpenGarage={() => setTab("garage")} />;

  return (
    <>
      <AppShell activeTab={tab} onAddFuel={() => setActionOpen(true)} onSettings={() => setTab("settings")} onTabChange={setTab}>
        <div className="motion-chart-enter" data-motion="tab-content" key={tab}>{content}</div>
      </AppShell>
      <QuickActionSheet onClose={() => setActionOpen(false)} onSelect={choose} open={actionOpen} />
      <FuelLogSheet activeFuelOptions={activeFuelOptions} onClose={() => setFuelOpen(false)} onSubmit={saveFuel} open={fuelOpen} stationSuggestions={stations} />
      <ExpenseSheet currencyCode={activeVehicle.currencyCode} onClose={() => setExpenseOpen(false)} onSubmit={saveExpense} open={expenseOpen} />
      <ServiceVisitSheet currencyCode={activeVehicle.currencyCode} items={activeItems} onClose={() => setServiceOpen(false)} onSubmit={saveService} open={serviceOpen} />
      <WhatsNewSheet />
    </>
  );
}

export default function App() {
  return <ToastProvider><AppProvider><AppContent /></AppProvider></ToastProvider>;
}
