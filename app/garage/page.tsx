import type { Metadata } from "next";
import { Bike } from "lucide-react";

import { PagePlaceholder } from "@/components/ui/PagePlaceholder";

export const metadata: Metadata = {
  title: "Garage",
};

export default function GaragePage() {
  return (
    <PagePlaceholder
      description="Add and manage the motorcycles and cars you want to keep in view."
      eyebrow="GARAGE"
      icon={Bike}
      title="Your garage"
    />
  );
}
