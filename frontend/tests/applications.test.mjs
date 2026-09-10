import assert from 'node:assert';
import { fileCounts, sortByFiled } from '../src/lib/applications.ts';

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

const row = (status, i) => ({
  id: `id-${i}`,
  onboarding_profile_id: 'p1',
  feasibility_report: null,
  financial_roadmap: null,
  status,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

test('an empty list counts as three zeroes, not as a missing strip', () => {
  assert.deepStrictEqual(fileCounts([]), { filed: 0, complete: 0, pending: 0 });
});

test('complete and pending split the filed rows', () => {
  const rows = [row('complete', 1), row('draft', 2), row('complete', 3)];
  assert.deepStrictEqual(fileCounts(rows), { filed: 3, complete: 2, pending: 1 });
});

// The summary strip claims a relationship between its three figures. If the
// counts ever stop adding up, the screen is telling the applicant something
// untrue about their own filings - so it is asserted, not eyeballed.
test('filed always equals complete plus pending', () => {
  const shapes = [
    [],
    [row('draft', 1)],
    [row('complete', 1)],
    [row('complete', 1), row('draft', 2), row('draft', 3), row('complete', 4)],
    // a status this build does not know: it must still be counted somewhere,
    // or the total would silently understate what the account has filed
    [row('in_review', 1), row('complete', 2)],
  ];
  for (const rows of shapes) {
    const c = fileCounts(rows);
    assert.strictEqual(c.filed, c.complete + c.pending, JSON.stringify(rows.map((r) => r.status)));
    assert.strictEqual(c.filed, rows.length);
  }
});

const at = (id, iso) => ({ ...row('complete', id), id, created_at: iso });

test('newest first and oldest first are the real filed-date order', () => {
  const rows = [
    at('mar', '2026-03-01T00:00:00.000Z'),
    at('jan', '2026-01-01T00:00:00.000Z'),
    at('feb', '2026-02-01T00:00:00.000Z'),
  ];
  assert.deepStrictEqual(
    sortByFiled(rows, 'newest').map((r) => r.id),
    ['mar', 'feb', 'jan'],
  );
  assert.deepStrictEqual(
    sortByFiled(rows, 'oldest').map((r) => r.id),
    ['jan', 'feb', 'mar'],
  );
});

test('sorting leaves the fetched list alone and keeps every row', () => {
  const rows = [at('b', '2026-02-01T00:00:00.000Z'), at('a', '2026-01-01T00:00:00.000Z')];
  const before = rows.map((r) => r.id);
  const sorted = sortByFiled(rows, 'oldest');
  assert.deepStrictEqual(
    rows.map((r) => r.id),
    before,
  );
  assert.strictEqual(sorted.length, rows.length);
});

// An unparseable date cannot be ranked. It must still be listed - dropping a
// filed application because of its timestamp would hide the applicant's own row.
test('a row with an unreadable filed date sorts last, in both directions', () => {
  const rows = [at('bad', 'not-a-date'), at('jan', '2026-01-01T00:00:00.000Z')];
  for (const order of ['newest', 'oldest']) {
    const ids = sortByFiled(rows, order).map((r) => r.id);
    assert.deepStrictEqual(ids, ['jan', 'bad'], order);
  }
});

console.log(`\n${n} passed`);
