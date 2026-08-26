function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function dateFromParts(year: number, month: number, day: number) {
  return isValidDateParts(year, month, day)
    ? new Date(Date.UTC(year, month - 1, day, 12))
    : null;
}

function excelSerialDate(value: string) {
  if (!/^\d{4,5}(?:\.\d+)?$/.test(value)) {
    return null;
  }

  const serial = Number(value);
  if (!Number.isFinite(serial) || serial < 20_000 || serial > 80_000) {
    return null;
  }

  // Excel's 1900 date system includes a historical leap-year bug.
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
}

/** Parses common spreadsheet date forms without relying on locale-dependent Date.parse. */
export function parseCalendarDate(value: string) {
  const source = value.trim();
  const excelDate = excelSerialDate(source);
  if (excelDate) {
    return excelDate;
  }

  const iso = source.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:T.*)?$/);
  if (iso) {
    return dateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const localized = source.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (localized) {
    const first = Number(localized[1]);
    const second = Number(localized[2]);
    const year = Number(localized[3]);
    // Prefer month/day when ambiguous because that is Excel's default CSV form;
    // unambiguous 31/12/2026-style values remain day/month.
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    return dateFromParts(year, month, day);
  }

  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toCalendarDate(value: string, fallback = new Date()) {
  const date = parseCalendarDate(value) ?? fallback;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
