export function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localDateToIso(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
}

export function addDaysIso(days: number, source = new Date()) {
  const date = new Date(source);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function addMonthsIso(months: number, source = new Date()) {
  const date = new Date(source);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function formatLocalDate(isoTimestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(isoTimestamp));
}

export function daysUntil(isoTimestamp: string, now = new Date()) {
  const target = new Date(isoTimestamp);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}
