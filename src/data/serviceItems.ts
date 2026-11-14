import type { ServiceCadence, VehicleType } from "@/types";

export interface ServiceItemPreset {
  cadence: ServiceCadence;
  guidance: string;
  key: string;
  schedule: string;
  title: string;
}

export const SERVICE_CADENCE_LABELS: Record<ServiceCadence, string> = {
  "quick-check": "Quick checks",
  "minor-service": "Minor service",
  "major-service": "Major service",
  "long-term": "Long-term wear"
};

export const SERVICE_CADENCE_ORDER: ServiceCadence[] = ["quick-check", "minor-service", "major-service", "long-term"];

export const CAR_SERVICE_ITEMS: ServiceItemPreset[] = [
  { key: "car-engine-oil-coolant-levels", title: "Engine Oil & Coolant Levels", cadence: "quick-check", schedule: "Monthly / quick visual check", guidance: "Check the dipstick and coolant reservoir only when the engine is cool." },
  { key: "car-tires", title: "Tires", cadence: "quick-check", schedule: "Monthly / quick visual check", guidance: "Check pressure including the spare, tread depth, and uneven wear." },
  { key: "car-lights-wipers", title: "Lights & Wipers", cadence: "quick-check", schedule: "Monthly / quick visual check", guidance: "Test headlights, brake lights, signals, and replace streaking wiper blades." },
  { key: "car-battery", title: "Battery", cadence: "quick-check", schedule: "Monthly / quick visual check", guidance: "Inspect terminals for corrosion and confirm connections are tight." },
  { key: "car-engine-oil", title: "Engine Oil", cadence: "minor-service", schedule: "Every 10,000 km or 6 months", guidance: "Replace with manufacturer-recommended fully synthetic oil; 5W-30 or 5W-40 is common in tropical climates." },
  { key: "car-oil-filter", title: "Oil Filter", cadence: "minor-service", schedule: "Every 10,000 km or 6 months", guidance: "Replace with the oil service and fit a fresh drain-plug washer where required." },
  { key: "car-fluid-leak-checks", title: "Fluid Top-Ups & Leak Checks", cadence: "minor-service", schedule: "Every 10,000 km or 6 months", guidance: "Inspect brake, power-steering, and washer fluids, then check the bay and undercarriage for leaks." },
  { key: "car-brake-inspection", title: "Brake Inspection", cadence: "minor-service", schedule: "Every 10,000 km or 6 months", guidance: "Check front and rear pad thickness plus rotor condition." },
  { key: "car-tire-rotation", title: "Tire Rotation", cadence: "minor-service", schedule: "Every 10,000 km or 6 months", guidance: "Rotate tires to promote even tread wear unless the tyre setup prevents it." },
  { key: "car-engine-air-filter", title: "Engine Air Filter", cadence: "major-service", schedule: "Every 20,000–40,000 km or 1–2 years", guidance: "Replace when due to protect airflow and fuel efficiency." },
  { key: "car-cabin-aircon-filter", title: "Cabin (Aircon) Filter", cadence: "major-service", schedule: "Every 20,000–40,000 km or 1–2 years", guidance: "Replace to keep A/C airflow strong and clean." },
  { key: "car-transmission-fluid", title: "Transmission Fluid", cadence: "major-service", schedule: "Every 20,000–40,000 km or 1–2 years", guidance: "Drain and refill with manufacturer-specified fluid; avoid aggressive flushes unless the manual specifies them." },
  { key: "car-brake-fluid", title: "Brake Fluid", cadence: "major-service", schedule: "Every 20,000–40,000 km or 1–2 years", guidance: "Flush every 2–3 years because brake fluid absorbs moisture." },
  { key: "car-suspension-steering", title: "Suspension & Steering Check", cadence: "major-service", schedule: "Every 20,000–40,000 km or 1–2 years", guidance: "Inspect tie rods, ball joints, CV boots, and shocks for leaks, cracks, or play." },
  { key: "car-drive-belt", title: "Drive Belt (Serpentine Belt)", cadence: "major-service", schedule: "Every 20,000–40,000 km or 1–2 years", guidance: "Inspect for cracks, fraying, glazing, or tension issues." },
  { key: "car-spark-plugs", title: "Spark Plugs", cadence: "long-term", schedule: "Every 80,000–100,000 km or 5+ years", guidance: "Replace with iridium or platinum plugs when due for the engine type." },
  { key: "car-engine-coolant", title: "Engine Coolant", cadence: "long-term", schedule: "Every 80,000–100,000 km or 5+ years", guidance: "Drain and refill with manufacturer-specified premixed coolant." },
  { key: "car-valve-clearance", title: "Valve Clearance Inspection", cadence: "long-term", schedule: "Every 80,000–100,000 km or 5+ years", guidance: "Inspect and adjust mechanical valvetrains if ticking or rough idle develops." },
  { key: "car-engine-transmission-mounts", title: "Engine & Transmission Mounts", cadence: "long-term", schedule: "Every 80,000–100,000 km or 5+ years", guidance: "Check for worn or collapsed mounts when cabin vibration is heavy in Drive or Reverse." },
  { key: "car-fuel-filter-pcv", title: "Fuel Filter & PCV Valve", cadence: "long-term", schedule: "Every 80,000–100,000 km or 5+ years", guidance: "Inspect and replace as needed based on the manufacturer schedule and symptoms." }
];

export const MOTORCYCLE_SERVICE_ITEMS: ServiceItemPreset[] = [
  { key: "motorcycle-drive-chain", title: "Drive Chain", cadence: "quick-check", schedule: "Weekly / pre-ride; every 500–800 km", guidance: "Clean, lube, and check slack per the owner’s manual, especially after heavy rain." },
  { key: "motorcycle-tire-pressure-tread", title: "Tire Pressure & Tread", cadence: "quick-check", schedule: "Weekly / pre-ride", guidance: "Check cold pressure against manufacturer specifications and inspect tread for wear or punctures." },
  { key: "motorcycle-oil-coolant-check", title: "Engine Oil & Coolant Check", cadence: "quick-check", schedule: "Weekly / pre-ride", guidance: "Verify oil is between min/max marks and check coolant level when the bike is liquid-cooled." },
  { key: "motorcycle-controls-lights", title: "Controls & Lights", cadence: "quick-check", schedule: "Weekly / pre-ride", guidance: "Test lights, signals, horn, and brake/clutch lever free play." },
  { key: "motorcycle-engine-oil", title: "Engine Oil", cadence: "minor-service", schedule: "Every 2,500–3,000 km or 3 months", guidance: "Use manufacturer-recommended JASO MA/MA2 motorcycle oil; 10W-40 is common in tropical climates." },
  { key: "motorcycle-oil-filter", title: "Oil Filter Element", cadence: "minor-service", schedule: "Every 2,500–3,000 km or 3 months", guidance: "Replace per the service manual with the required O-rings or crush washers." },
  { key: "motorcycle-brake-pad-check", title: "Brake Pad Check", cadence: "minor-service", schedule: "Every 2,500–3,000 km or 3 months", guidance: "Inspect front and rear pad thickness plus rotor wear." },
  { key: "motorcycle-cable-pivot-lubrication", title: "Cable & Pivot Lubrication", cadence: "minor-service", schedule: "Every 2,500–3,000 km or 3 months", guidance: "Lubricate clutch and throttle cables, side-stand pivot, and brake/shift pedal joints." },
  { key: "motorcycle-air-filter", title: "Air Filter Element", cadence: "major-service", schedule: "Every 10,000–12,000 km or 1 year", guidance: "Inspect, clean, or replace according to paper, foam, or reusable filter type." },
  { key: "motorcycle-spark-plugs", title: "Spark Plug(s)", cadence: "major-service", schedule: "Every 10,000–12,000 km or 1 year", guidance: "Inspect and replace standard or iridium plugs as the manual specifies." },
  { key: "motorcycle-coolant-flush", title: "Coolant Flush", cadence: "major-service", schedule: "Every 10,000–12,000 km or 1 year", guidance: "For liquid-cooled bikes, use motorcycle-safe ethylene-glycol coolant every 1–2 years." },
  { key: "motorcycle-brake-fluid-flush", title: "Brake Fluid Flush", cadence: "major-service", schedule: "Every 10,000–12,000 km or 1 year", guidance: "Flush front and rear brake fluid with DOT 4 or the specified fluid every 1–2 years." },
  { key: "motorcycle-throttle-fuel-system", title: "Throttle Body / Fuel System Check", cadence: "major-service", schedule: "Every 10,000–12,000 km or 1 year", guidance: "Clean the throttle body, carburetor, or injector when idle is rough or throttle response lags." },
  { key: "motorcycle-chain-sprocket", title: "Chain & Sprocket Kit", cadence: "long-term", schedule: "Every 20,000–30,000 km or 2–3+ years", guidance: "Replace chain and both sprockets together when teeth hook or stretch becomes uneven." },
  { key: "motorcycle-valve-clearance", title: "Valve Clearance Inspection", cadence: "long-term", schedule: "Every 20,000–30,000 km or 2–3+ years", guidance: "Check and adjust when cold starts worsen or top-end ticking increases." },
  { key: "motorcycle-fork-oil-seals", title: "Front Fork Oil & Seals", cadence: "long-term", schedule: "Every 20,000–30,000 km or 2–3+ years", guidance: "Replace fork oil and inspect seals for weeping or pitting." },
  { key: "motorcycle-steering-wheel-bearings", title: "Steering Head & Wheel Bearings", cadence: "long-term", schedule: "Every 20,000–30,000 km or 2–3+ years", guidance: "Check for notchy steering or wheel play; repack or replace bearings as needed." },
  { key: "motorcycle-battery-charging", title: "Battery & Charging System Check", cadence: "long-term", schedule: "Every 20,000–30,000 km or 2–3+ years", guidance: "Test resting voltage and charging output against the manufacturer specification." }
];

export const LEGACY_STANDARD_SERVICE_ITEMS = [
  "Engine Oil", "Oil Filter", "Air Filter", "Cabin Filter", "Brake Pads", "Brake Fluid", "Tires", "Battery", "Timing Belt", "Spark Plugs", "Chain & Sprockets", "Coolant", "Wheel Alignment", "Clutch", "Suspension", "Wipers", "Transmission Fluid", "Fuel Filter", "Lights / Bulbs", "Inspection", "Engine Mounts", "Brake Discs"
] as const;

export const STANDARD_SERVICE_ITEMS = LEGACY_STANDARD_SERVICE_ITEMS;

const LEGACY_PRESET_KEYS: Record<VehicleType, Record<string, string>> = {
  car: {
    "engine oil": "car-engine-oil",
    "oil filter": "car-oil-filter",
    "air filter": "car-engine-air-filter",
    "cabin filter": "car-cabin-aircon-filter",
    "brake pads": "car-brake-inspection",
    "brake fluid": "car-brake-fluid",
    tires: "car-tires",
    battery: "car-battery",
    "spark plugs": "car-spark-plugs",
    coolant: "car-engine-coolant",
    suspension: "car-suspension-steering",
    wipers: "car-lights-wipers",
    "transmission fluid": "car-transmission-fluid",
    "fuel filter": "car-fuel-filter-pcv",
    "lights bulbs": "car-lights-wipers",
    "engine mounts": "car-engine-transmission-mounts",
    "brake discs": "car-brake-inspection"
  },
  motorcycle: {
    "engine oil": "motorcycle-engine-oil",
    "oil filter": "motorcycle-oil-filter",
    "air filter": "motorcycle-air-filter",
    "brake pads": "motorcycle-brake-pad-check",
    "brake fluid": "motorcycle-brake-fluid-flush",
    tires: "motorcycle-tire-pressure-tread",
    battery: "motorcycle-battery-charging",
    "spark plugs": "motorcycle-spark-plugs",
    "chain sprockets": "motorcycle-chain-sprocket",
    coolant: "motorcycle-coolant-flush",
    clutch: "motorcycle-cable-pivot-lubrication",
    suspension: "motorcycle-fork-oil-seals",
    "fuel filter": "motorcycle-throttle-fuel-system",
    "lights bulbs": "motorcycle-controls-lights",
    "brake discs": "motorcycle-brake-pad-check"
  }
};

function normalizedTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function serviceItemsForVehicleType(type: VehicleType) {
  return type === "car" ? CAR_SERVICE_ITEMS : MOTORCYCLE_SERVICE_ITEMS;
}

export function servicePresetForKey(type: VehicleType, key: string) {
  return serviceItemsForVehicleType(type).find((item) => item.key === key);
}

export function servicePresetForLegacyTitle(type: VehicleType, title: string) {
  const presets = serviceItemsForVehicleType(type);
  const direct = presets.find((item) => normalizedTitle(item.title) === normalizedTitle(title));
  if (direct) return direct;
  const key = LEGACY_PRESET_KEYS[type][normalizedTitle(title)];
  return key ? servicePresetForKey(type, key) : undefined;
}

export function serviceItemId(vehicleId: string, identifier: string) {
  return `service-item_${vehicleId}_${identifier.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
