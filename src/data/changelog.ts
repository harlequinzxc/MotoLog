export interface ReleaseNote { version: string; date: string; title: string; highlights: string[] }
export const CHANGELOG: ReleaseNote[] = [
  { version: "v1.1.1", date: "2026-08-26", title: "Service Index Repair", highlights: ["Fixed service item loading on existing and new IndexedDB v2 databases.", "Replaced an invalid single-field Dexie index query with safe in-memory title sorting."] },
  { version: "v1.1.0", date: "2026-08-26", title: "Predictive Tracking", highlights: ["Live consumption gauge and next-fill prediction.", "Multi-item service visits and custom maintenance items.", "Unified fuel, service, and expense logbook."] },
  { version: "v1.0.0", date: "2026-08-26", title: "Core Fuel Tracker", highlights: ["Offline multi-vehicle fuel logging.", "Any-2-of-3 price, volume, and total cost calculator.", "Full, partial, and missed-fill efficiency protection."] }
];
