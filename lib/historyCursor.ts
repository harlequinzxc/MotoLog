import type { FillUp } from "@/lib/types";

export const HISTORY_PAGE_SIZE = 30;

export interface HistoryCursorPage {
  items: FillUp[];
  nextCursor: string | null;
}

/**
 * Local cursor adapter. It mirrors the API cursor contract so the history UI
 * can use the same 30-row infinite-scroll flow with localStorage today and a
 * remote API later without changing the rendering layer.
 */
export function queryHistoryCursorPage(
  fillUps: FillUp[],
  cursor: string | null,
  limit = HISTORY_PAGE_SIZE,
): HistoryCursorPage {
  const offset = cursor === null ? 0 : Math.max(Number.parseInt(cursor, 10) || 0, 0);
  const items = fillUps.slice(offset, offset + limit);
  const nextOffset = offset + items.length;

  return {
    items,
    nextCursor: nextOffset < fillUps.length ? String(nextOffset) : null,
  };
}
