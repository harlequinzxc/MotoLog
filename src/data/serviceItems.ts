export const STANDARD_SERVICE_ITEMS = [
  "Engine Oil",
  "Oil Filter",
  "Air Filter",
  "Cabin Filter",
  "Brake Pads",
  "Brake Fluid",
  "Tires",
  "Battery",
  "Timing Belt",
  "Spark Plugs",
  "Chain & Sprockets",
  "Coolant",
  "Wheel Alignment",
  "Clutch",
  "Suspension",
  "Wipers",
  "Transmission Fluid",
  "Fuel Filter",
  "Lights / Bulbs",
  "Inspection",
  "Engine Mounts",
  "Brake Discs"
] as const;

export function serviceItemId(vehicleId: string, title: string) {
  return `service-item_${vehicleId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
