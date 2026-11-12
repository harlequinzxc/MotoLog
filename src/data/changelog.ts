export interface ReleaseNote {
  date: string;
  highlights: string[];
  title: string;
  version: string;
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: "v0.1.0",
    date: "2026-08-26",
    title: "Foundation",
    highlights: [
      "Offline-first multi-vehicle garage powered by IndexedDB.",
      "Fixed-cost renewal tracking and type-aware service presets.",
      "Singapore and Malaysia sample data for safe exploration."
    ]
  }
];
