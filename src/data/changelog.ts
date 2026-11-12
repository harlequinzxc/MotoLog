export interface ReleaseNote {
  date: string;
  highlights: string[];
  title: string;
  version: string;
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: "v1.0.0",
    date: "2026-08-26",
    title: "Core Fuel Tracker",
    highlights: [
      "Offline-first vehicles and fuel fill-up tracking.",
      "Accurate full-tank mileage calculations with partial-fill support.",
      "Native SGD and MYR sample fuel transactions."
    ]
  }
];
