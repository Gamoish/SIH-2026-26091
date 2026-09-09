import assert from 'node:assert';
import { buildReport } from '../src/domain/feasibility.ts';
import { planLoan, projectCostFrom, isGap } from '../src/domain/finance.ts';
import { MOCK_VILLAGES } from '../src/data/fixtures/villages.ts';
import { MOCK_BUSINESSES, MOCK_COMPETITOR_COUNTS } from '../src/data/fixtures/businesses.ts';

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

const report = (patch = {}) =>
  buildReport({ villageId: 'jarha', businessId: 'leaf-plates', radiusKm: 10, capital: 22000, ...patch });

test('revenue moves with village, radius and business', () => {
  const base = report().estimatedAnnualRevenue;
  assert.notEqual(base, report({ villageId: 'kutku' }).estimatedAnnualRevenue, 'village ignored');
  assert.notEqual(base, report({ radiusKm: 5 }).estimatedAnnualRevenue, 'radius ignored');
  assert.notEqual(base, report({ businessId: 'grocery' }).estimatedAnnualRevenue, 'business ignored');
});

test('revenue is not a bare multiple of capital', () => {
  const r = report();
  const ratio = r.estimatedAnnualRevenue / 22000;
  // A capital multiple would hold across every village; this one must not.
  assert.notEqual(ratio, report({ villageId: 'bijpur' }).estimatedAnnualRevenue / 22000);
});

test('both ceilings bind somewhere, and the estimate is the lower one', () => {
  // The demo walkthrough - Jarha, 10 km, leaf-plates, Rs 22,000 - is
  // market-limited, which is the right answer: Rs 2.2 lakh of project cost can
  // genuinely outrun a 35,000-person catchment that already has six presses.
  assert.equal(report().revenueLimitedBy, 'market');

  // REFERENCE CASE for the other branch: same village, same market, Rs 2,000
  // of own capital. Capacity binds below roughly Rs 8,000, so this is the one
  // to demo if you want to see "limited by your capital" on screen. It is
  // deliberately not the primary walkthrough.
  const poor = report({ capital: 2000 });
  assert.equal(poor.revenueLimitedBy, 'capital');
  assert.ok(poor.estimatedAnnualRevenue < report().estimatedAnnualRevenue);
  // Rs 20,000 project cost, 23% of it working capital, 8 turns a year.
  assert.equal(poor.estimatedAnnualRevenue, 20000 * 0.23 * 8);
});

test('grocery differs between villages of similar size', () => {
  const grocery = (villageId) => report({ villageId, businessId: 'grocery' }).estimatedAnnualRevenue;
  // Bijpur is bigger than Ranitali but shops in town; without the spend index
  // these two came out within a few hundred rupees of each other.
  assert.notEqual(grocery('bijpur'), grocery('ranitali'));
  assert.ok(grocery('dudhi') > grocery('kutku'), 'the block town should out-spend Kutku');
});

test('feasibility and finance agree on project cost', () => {
  for (const capital of [2000, 22000, 150000]) {
    const plan = planLoan(capital, 'ST'); // NSTFDC, 10% beneficiary contribution
    assert.ok(!isGap(plan));
    assert.equal(plan.projectCost, projectCostFrom(capital, plan.beneficiaryPct));
    assert.equal(plan.projectCost, projectCostFrom(capital));
  }
});

test('competitor counts come from the hand-authored table', () => {
  for (const v of MOCK_VILLAGES) {
    for (const b of Object.keys(MOCK_BUSINESSES)) {
      const r = buildReport({ villageId: v.id, businessId: b, radiusKm: 0, capital: 22000 });
      assert.equal(r.competitors[0].count, MOCK_COMPETITOR_COUNTS[v.id][b], `${v.id}/${b}`);
    }
  }
});

test('Jarha has no leaf-plate unit — the walkthrough depends on it', () => {
  assert.equal(MOCK_COMPETITOR_COUNTS.jarha['leaf-plates'], 0);
  const own = report().competitors.find((c) => c.isYours);
  assert.equal(own.count, 0);
});

test('a real LGD village still returns nothing', () => {
  assert.equal(report({ villageId: 'lgd-123456' }), null);
});

console.log(`\n${n} feasibility tests passed`);
