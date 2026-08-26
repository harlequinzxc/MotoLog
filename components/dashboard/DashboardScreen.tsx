"use client";

import { LayoutDashboard } from "lucide-react";

import { GarageScreen } from "@/components/garage/GarageScreen";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { useAppContext } from "@/context/AppContext";

/** Uses the Garage first-run flow until there is a vehicle to power the dash. */
export function DashboardScreen() {
  const { isHydrated, vehicles } = useAppContext();

  if (!isHydrated || vehicles.length === 0) {
    return <GarageScreen />;
  }

  return (
    <PagePlaceholder
      description="Your active vehicle, fuel economy, and ride insights will appear here."
      eyebrow="DASH"
      icon={LayoutDashboard}
      title="Your dashboard"
    />
  );
}
