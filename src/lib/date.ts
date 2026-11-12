export function localDateTimeInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
export function localDateTimeToIso(value: string) { const [datePart, timePart] = value.split("T"); const [year, month, day] = datePart.split("-").map(Number); const [hour, minute] = timePart.split(":").map(Number); return new Date(year, month - 1, day, hour, minute).toISOString(); }
export function formatLocalDateTime(iso: string) { return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)); }
