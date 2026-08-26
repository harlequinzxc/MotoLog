import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PagePlaceholder
      description="Personalize your MotoLog preferences, data, and appearance here."
      eyebrow="SETTINGS"
      icon={Settings}
      title="Make it yours"
    />
  );
}
