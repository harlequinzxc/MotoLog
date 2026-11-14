import { APP_VERSION } from "@/data/appVersion";

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: "v1.6.0",
    date: "2026-08-26",
    title: "Native App Controls",
    highlights: [
      "Replaced system dropdowns with app-native sheet pickers and a native vehicle selector.",
      "Hardened overlays through body portals and refined settings switches for reliable independent states.",
      "Removed chart and table horizontal scrolling so content stays within the app viewport."
    ]
  },
  {
    version: "v1.5.2",
    date: "2026-08-26",
    title: "Control & Overlay Reliability",
    highlights: [
      "Rebuilt settings switches with correct independent On/Off states.",
      "Made bottom-sheet mounting deterministic so overlays open reliably on mobile browsers."
    ]
  },
  {
    version: "v1.5.1",
    date: "2026-08-26",
    title: "Sheet Scroll Lock",
    highlights: [
      "Locked background scrolling while a bottom sheet is open.",
      "Contained sheet overscroll so long changelog content scrolls independently on iOS."
    ]
  },
  {
    version: "v1.5.0",
    date: "2026-08-26",
    title: "Type-Specific Maintenance",
    highlights: [
      "Split maintenance checklists into general Car and Motorcycle service schedules.",
      "Added grouped cadence, schedule, and guidance details to the Service tab and visit picker.",
      "Migrated existing service history safely while keeping custom and historical items intact."
    ]
  },
  {
    version: "v1.4.2",
    date: "2026-08-26",
    title: "iOS Safe-Area Repair",
    highlights: [
      "Added explicit installed-iOS status-bar and home-indicator insets.",
      "Matched the fixed navigation height to its content clearance and removed the translucent bottom safe-area seam."
    ]
  },
  {
    version: "v1.4.1",
    date: "2026-08-26",
    title: "Tab Rendering Repair",
    highlights: [
      "Fixed tab content that could remain hidden until another tab was selected.",
      "Replaced deferred page swapping with immediate selected-tab mounting and a safe entry animation."
    ]
  },
  {
    version: "v1.4.0",
    date: "2026-08-26",
    title: "Daily-Driver Interface",
    highlights: [
      "Rebuilt the dashboard around live drive state and the next fill decision.",
      "Replaced repeated wrapper cards with dense, hairline-separated ownership views.",
      "Sharpened garage, service, logbook, reports, settings, and release-history hierarchy."
    ]
  },
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
