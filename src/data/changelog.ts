import { APP_VERSION } from "@/data/appVersion";

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: "v1.3.0",
    date: "2026-08-26",
    title: "Motion & Accessibility Controls",
    highlights: [
      "Added a persisted Reduced Motion setting with system-preference fallback.",
      "Animated sheets, toasts, tabs, lists, charts, and tactile controls with motion-safe fallbacks.",
      "Improved empty states, retry feedback, and numeric alignment across the app."
    ]
  },
  {
    version: "v1.2.0",
    date: "2026-08-26",
    title: "Reports & Release Hub",
    highlights: [
      "Added lazy-loaded spending, monthly cost, and consumption analytics.",
      "Expanded Settings with garage access, live version details, and full release history.",
      "Added automatic What’s New acknowledgements for each app version."
    ]
  },
  {
    version: "v1.1.1",
    date: "2026-08-26",
    title: "Service Index Repair",
    highlights: [
      "Fixed service item loading on existing and new IndexedDB v2 databases.",
      "Replaced an invalid single-field Dexie index query with safe in-memory title sorting."
    ]
  },
  {
    version: "v1.1.0",
    date: "2026-08-26",
    title: "Predictive Tracking",
    highlights: [
      "Live consumption gauge and next-fill prediction.",
      "Multi-item service visits and custom maintenance items.",
      "Unified fuel, service, and expense logbook."
    ]
  },
  {
    version: "v1.0.0",
    date: "2026-08-26",
    title: "Core Fuel Tracker",
    highlights: [
      "Offline multi-vehicle fuel logging.",
      "Any-2-of-3 price, volume, and total cost calculator.",
      "Full, partial, and missed-fill efficiency protection."
    ]
  }
];

const currentRelease = CHANGELOG.find((release) => release.version === APP_VERSION);

if (!currentRelease) {
  throw new Error(`Missing changelog entry for ${APP_VERSION}.`);
}

export const CURRENT_RELEASE = currentRelease;
