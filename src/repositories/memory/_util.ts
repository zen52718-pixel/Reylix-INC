/** Adapter-internal helpers for the in-memory repositories. */

/** Shallow equality filter: every defined key in `filter` must equal the row's value. */
export function matchesFilter<T extends object>(row: T, filter: Partial<T>): boolean {
  return Object.entries(filter).every(
    ([key, value]) => value === undefined || (row as Record<string, unknown>)[key] === value,
  );
}

/** Inclusive ISO date-range check against a row timestamp. */
export function withinRange(iso: string, range?: { from?: string; to?: string }): boolean {
  if (!range) return true;
  const t = Date.parse(iso);
  if (range.from && t < Date.parse(range.from)) return false;
  if (range.to && t > Date.parse(range.to)) return false;
  return true;
}
