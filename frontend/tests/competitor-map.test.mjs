import assert from 'node:assert';
import { buildReport } from '../src/domain/feasibility.ts';
import { distanceKm } from '../src/data/fixtures/villages.ts';
import { MOCK_COMPETITOR_POINTS } from '../src/data/fixtures/sample-competitors.ts';

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

const report = (patch = {}) =>
  buildReport({ villageId: 'jarha', businessId: 'grocery', radiusKm: 5, capital: 22000, ...patch });

test('one point per competitor the report counts', () => {
  const r = report();
  assert.equal(MOCK_COMPETITOR_POINTS(r).length, r.totalCompetitors);
});

test('per-village counts match the report row', () => {
  const r = report();
  const points = MOCK_COMPETITOR_POINTS(r);
  for (const row of r.competitors) {
    assert.equal(
      points.filter((p) => p.village.en === row.name.en).length,
      row.count,
      `${row.name.en} should have ${row.count} points`,
    );
  }
});

test('every point sits inside the chosen radius', () => {
  for (const radiusKm of [3, 5, 10]) {
    const r = report({ radiusKm });
    for (const p of MOCK_COMPETITOR_POINTS(r)) {
      const km = distanceKm(r.village, p);
      assert.ok(km <= radiusKm + 1e-9, `point ${p.id} is ${km.toFixed(2)} km out, radius ${radiusKm}`);
      assert.equal(p.km, Math.round(km * 10) / 10);
    }
  }
});

test('same seed, identical points', () => {
  assert.deepEqual(MOCK_COMPETITOR_POINTS(report()), MOCK_COMPETITOR_POINTS(report()));
});

test('a different village, business or radius moves the points', () => {
  const base = JSON.stringify(MOCK_COMPETITOR_POINTS(report()));
  assert.notEqual(base, JSON.stringify(MOCK_COMPETITOR_POINTS(report({ villageId: 'dudhi' }))));
  assert.notEqual(base, JSON.stringify(MOCK_COMPETITOR_POINTS(report({ businessId: 'tailoring' }))));
  assert.notEqual(base, JSON.stringify(MOCK_COMPETITOR_POINTS(report({ radiusKm: 10 }))));
});

test('every sample record is marked as sample', () => {
  for (const p of MOCK_COMPETITOR_POINTS(report())) {
    assert.ok(p.name.en.startsWith('Sample: '), p.name.en);
    assert.ok(p.name.hi.startsWith('नमूना: '), p.name.hi);
  }
});

console.log(`\n${n} passed`);
