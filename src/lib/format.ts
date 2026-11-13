export function formatCurrency(value: number | null, currencyCode: string) {
  if (value === null || !Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat(undefined, {
      currency: currencyCode,
      currencyDisplay: "code",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: "currency"
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}
