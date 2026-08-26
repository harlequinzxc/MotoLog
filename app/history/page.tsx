import type { Metadata } from "next";
import { History } from "lucide-react";

import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export const metadata: Metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <PagePlaceholder
      description="Every fill-up and ride log will be easy to review in one clear timeline."
      eyebrow="HISTORY"
      icon={History}
      title="Your ride history"
    />
  );
}
