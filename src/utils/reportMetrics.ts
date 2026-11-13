import type { ExpenseCategory, ExpenseRecord, FuelLog, ServiceVisit, Vehicle } from "@/types";
import type { Timeframe } from "@/utils/dashboardMetrics";

export type ReportCategoryKey = "fuel" | "service" | ExpenseCategory;

type MonthlySpendKey = "expenses" | "fuel" | "service";

export interface SpendingCategory {
  amount: number;
  key: ReportCategoryKey;
  label: string;
  share: number;
}

export interface MonthlySpend {
  expenses: number;
  fuel: number;
  key: string;
  label: string;
  service: number;
  total: number;
}

export interface ConsumptionPoint {
  efficiencyKmPerLitre: number;
  id: string;
  occurredAt: string;
}

export interface ReportMetrics {
  averageFuelPricePerLitre: number | null;
  consumptionPoints: ConsumptionPoint[];
  excludedCurrencyRecordCount: number;
  fuelCostPerDistanceKm: number | null;
  fuelSpending: number;
  monthlySpending: MonthlySpend[];
  moneyRecordCount: number;
  serviceSpending: number;
  spendingCategories: SpendingCategory[];
  totalCostPerDistanceKm: number | null;
  totalDistanceKm: number;
  totalExpenseSpending: number;
  totalSpending: number;
}

export interface ReportMetricsInput {
  expenseRecords: ExpenseRecord[];
  fuelLogs: FuelLog[];
  now?: Date;
  serviceVisits: ServiceVisit[];
  timeframe: Timeframe;
  vehicle: Vehicle;
}

const CATEGORY_LABELS: Record<ReportCategoryKey, string> = {
  accessories: "Accessories",
  "financing-coe": "Financing / COE",
  fines: "Fines",
  fuel: "Fuel",
  insurance: "Insurance",
  inspection: "Inspection",
  leasing: "Leasing",
  other: "Other",
  parking: "Parking",
  repairs: "Repairs",
  "road-tax": "Road Tax",
  service: "Service",
  "tolls-erp": "Tolls / ERP",
  wash: "Car / Bike Wash"
};

function timeframeStart(timeframe: Timeframe, now: Date) {
  const start = new Date(now);
  if (timeframe === "30d") start.setDate(start.getDate() - 30);
  if (timeframe === "3m") start.setMonth(start.getMonth() - 3);
  if (timeframe === "1y") start.setFullYear(start.getFullYear() - 1);
  return timeframe === "all" ? null : start;
}

function isInTimeframe(occurredAt: string, timeframe: Timeframe, now: Date) {
  const timestamp = new Date(occurredAt);
  if (Number.isNaN(timestamp.getTime())) return false;
  const start = timeframeStart(timeframe, now);
  return start === null || timestamp >= start;
}

function validCost(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function positiveDistance(value: number | null) {
  return value !== null && Number.isFinite(value) && value > 0 ? value : 0;
}

function matchesCurrency(recordCurrency: string, homeCurrency: string) {
  return recordCurrency.toUpperCase() === homeCurrency.toUpperCase();
}

function monthDetails(occurredAt: string) {
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date)
  };
}

function addMonthlySpend(months: Map<string, MonthlySpend>, occurredAt: string, key: MonthlySpendKey, amount: number) {
  if (amount <= 0) return;
  const details = monthDetails(occurredAt);
  if (!details) return;
  const month = months.get(details.key) ?? {
    expenses: 0,
    fuel: 0,
    key: details.key,
    label: details.label,
    service: 0,
    total: 0
  };
  month[key] += amount;
  month.total += amount;
  months.set(details.key, month);
}

function addCategorySpend(categories: Map<ReportCategoryKey, number>, key: ReportCategoryKey, amount: number) {
  if (amount <= 0) return;
  categories.set(key, (categories.get(key) ?? 0) + amount);
}

export function buildReportMetrics({ expenseRecords, fuelLogs, now = new Date(), serviceVisits, timeframe, vehicle }: ReportMetricsInput): ReportMetrics {
  const scopedFuelLogs = fuelLogs.filter((log) => log.vehicleId === vehicle.id && isInTimeframe(log.occurredAt, timeframe, now));
  const scopedServiceVisits = serviceVisits.filter((visit) => visit.vehicleId === vehicle.id && isInTimeframe(visit.occurredAt, timeframe, now));
  const scopedExpenses = expenseRecords.filter((expense) => expense.vehicleId === vehicle.id && isInTimeframe(expense.occurredAt, timeframe, now));
  const categories = new Map<ReportCategoryKey, number>();
  const months = new Map<string, MonthlySpend>();
  let excludedCurrencyRecordCount = 0;
  let fuelSpending = 0;
  let serviceSpending = 0;
  let totalExpenseSpending = 0;
  let fuelPriceCost = 0;
  let fuelPriceVolume = 0;
  let moneyRecordCount = 0;

  for (const log of scopedFuelLogs) {
    if (!validCost(log.totalCost)) continue;
    if (!matchesCurrency(log.currencyCode, vehicle.currencyCode)) {
      excludedCurrencyRecordCount += 1;
      continue;
    }
    moneyRecordCount += 1;
    fuelSpending += log.totalCost;
    addCategorySpend(categories, "fuel", log.totalCost);
    addMonthlySpend(months, log.occurredAt, "fuel", log.totalCost);
    if (log.volumeLitres !== null && Number.isFinite(log.volumeLitres) && log.volumeLitres > 0) {
      fuelPriceCost += log.totalCost;
      fuelPriceVolume += log.volumeLitres;
    }
  }

  for (const visit of scopedServiceVisits) {
    if (!validCost(visit.totalCost)) continue;
    if (!matchesCurrency(visit.currencyCode, vehicle.currencyCode)) {
      excludedCurrencyRecordCount += 1;
      continue;
    }
    moneyRecordCount += 1;
    serviceSpending += visit.totalCost;
    addCategorySpend(categories, "service", visit.totalCost);
    addMonthlySpend(months, visit.occurredAt, "service", visit.totalCost);
  }

  for (const expense of scopedExpenses) {
    if (!validCost(expense.totalCost)) continue;
    if (!matchesCurrency(expense.currencyCode, vehicle.currencyCode)) {
      excludedCurrencyRecordCount += 1;
      continue;
    }
    moneyRecordCount += 1;
    totalExpenseSpending += expense.totalCost;
    addCategorySpend(categories, expense.category, expense.totalCost);
    addMonthlySpend(months, expense.occurredAt, "expenses", expense.totalCost);
  }

  const totalSpending = fuelSpending + serviceSpending + totalExpenseSpending;
  const totalDistanceKm = scopedFuelLogs.reduce((total, log) => total + positiveDistance(log.distanceKm), 0);
  const spendingCategories = [...categories.entries()]
    .map(([key, amount]) => ({ amount, key, label: CATEGORY_LABELS[key], share: totalSpending > 0 ? amount / totalSpending * 100 : 0 }))
    .sort((first, second) => second.amount - first.amount || first.label.localeCompare(second.label));
  const consumptionPoints = scopedFuelLogs
    .flatMap((log) => {
      const efficiency = log.efficiencyKmPerLitre;
      return log.mode === "full" && efficiency !== null && Number.isFinite(efficiency) && efficiency > 0
        ? [{ efficiencyKmPerLitre: efficiency, id: log.id, occurredAt: log.occurredAt }]
        : [];
    })
    .sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));

  return {
    averageFuelPricePerLitre: fuelPriceVolume > 0 ? fuelPriceCost / fuelPriceVolume : null,
    consumptionPoints,
    excludedCurrencyRecordCount,
    fuelCostPerDistanceKm: totalDistanceKm > 0 ? fuelSpending / totalDistanceKm : null,
    fuelSpending,
    monthlySpending: [...months.values()].sort((first, second) => first.key.localeCompare(second.key)),
    moneyRecordCount,
    serviceSpending,
    spendingCategories,
    totalCostPerDistanceKm: totalDistanceKm > 0 ? totalSpending / totalDistanceKm : null,
    totalDistanceKm,
    totalExpenseSpending,
    totalSpending
  };
}
