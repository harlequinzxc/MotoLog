export interface ReleaseNote { version: string; date: string; title: string; highlights: string[] }
export const CHANGELOG: ReleaseNote[] = [{ version: "v1.0.0", date: "2026-08-26", title: "Core Fuel Tracker", highlights: ["Offline multi-vehicle fuel logging.", "Any-2-of-3 price, volume, and total cost calculator.", "Full, partial, and missed-fill efficiency protection."] }];
