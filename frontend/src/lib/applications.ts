import type { Application } from './api';

/**
 * How the filed rows split by status, for the summary strip on the
 * applications screen.
 *
 * `filed` is every row, not a status of its own: a row exists because it was
 * filed. `complete` and `pending` partition it, so `filed === complete +
 * pending` always - anything else would mean the server sent a status outside
 * the enum, and a row of counts that does not add up is worse than no row.
 * A status this build does not know falls into `pending` rather than being
 * dropped, which keeps the total honest.
 */
export function fileCounts(rows: Application[]) {
  const complete = rows.filter((r) => r.status === 'complete').length;
  return { filed: rows.length, complete, pending: rows.length - complete };
}

export type SortOrder = 'newest' | 'oldest';

/**
 * The filed rows in the order the reader asked for, by the date they were
 * actually filed.
 *
 * The server already sends newest-first (`ORDER BY created_at DESC`), so this
 * re-sorts rather than assumes: a row whose `created_at` this browser cannot
 * parse would otherwise land wherever the server happened to put it. Those
 * sort to the end in both directions - a date we cannot read is not a date we
 * can rank, and guessing one would reorder the list on a lie.
 *
 * Returns a new array; the fetched list is never mutated.
 */
export function sortByFiled(rows: Application[], order: SortOrder): Application[] {
  const at = (r: Application) => {
    const t = new Date(r.created_at).getTime();
    return Number.isNaN(t) ? null : t;
  };
  return [...rows].sort((a, b) => {
    const x = at(a);
    const y = at(b);
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    return order === 'newest' ? y - x : x - y;
  });
}
