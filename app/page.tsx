import { LayoutDashboard } from "lucide-react";

import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      description="Your active vehicle, fuel economy, and ride insights will appear here."
      eyebrow="DASH"
      icon={LayoutDashboard}
      title="Your dashboard"
    />
  );
}
