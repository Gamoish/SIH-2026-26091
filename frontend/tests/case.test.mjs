import assert from 'node:assert';
import { caseFrom, emiShare, insight } from '../src/domain/case.ts';
import { isGap } from '../src/domain/finance.ts';

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

/** A session as onboarding leaves it, so the test exercises the real shape. */
const session = (patch = {}) => ({
  lang: 'hi',
  name: 'सुरेश खरवार',
  phone: '9876543210',
  photo: null,
  verified: true,
  social: 'ST',
  village: 'jarha',
  villageLgdCode: null,
  villageName: null,
  tehsil: null,
  radiusKm: 5,
  capital: 22000,
  business: 'leaf-plates',
  savedAt: null,
  ...patch,
});

test('a completed session resolves to a case', () => {
  const c = caseFrom(session());
  assert.ok(c.report, 'no report');
  assert.ok(c.report.score >= 0 && c.report.score <= 100);
});

test('an incomplete session yields no report, never a substituted one', () => {
  assert.equal(caseFrom(session({ village: null })).report, null);
  assert.equal(caseFrom(session({ business: null })).report, null);
  assert.equal(caseFrom(session({ capital: null })).report, null);
  // a real LGD village has no demo fixture behind it
  assert.equal(caseFrom(session({ village: 'lgd-999999' })).report, null);
});

test('both layouts derive the same plan from the same session', () => {
  const { plan } = caseFrom(session());
  assert.ok(!isGap(plan));
  assert.equal(plan.scheme.code, 'NSTFDC');
  // leaf-plates' anchor cost, not the capital grossed up
  assert.equal(plan.projectCost, 180000);
  assert.equal(plan.loanAmount, 158000);
  assert.equal(plan.requiredMargin, 18000);
});

test('the demo capital clears the required margin, so no note is shown', () => {
  const c = caseFrom(session());
  assert.equal(c.capitalFit, null, 'Rs 22,000 covers the Rs 18,000 NSTFDC asks for');
  // and a capital under it does raise one, through the same session shape
  const short = caseFrom(session({ capital: 12000 }));
  assert.ok(short.capitalFit);
  assert.equal(short.capitalFit.requiredMargin, 18000);
  assert.equal(short.capitalFit.capital, 12000);
});

test('an unconfirmed scheme yields a gap rather than an invented figure', () => {
  const c = caseFrom(session({ social: 'OBC' })); // NBCFDC, rate/tenure still TODO
  assert.ok(isGap(c.plan), 'expected a PlanGap for NBCFDC');
  assert.ok(c.plan.missing.length > 0);
  assert.equal(emiShare(c), null);
});

test('EMI share is a sane percentage of estimated income', () => {
  const share = emiShare(caseFrom(session()));
  assert.ok(share > 0 && share < 100, `implausible EMI share: ${share}`);
});

/**
 * The verdict screen's sentence is built from `insight()`, and `insight()`
 * recomputes headroom because buildReport keeps it as a local - see the note
 * there. If the engine's definition of headroom ever moves, the copy would go
 * on explaining the old one. This is what fails when that happens.
 *
 * The score is `headroom * 0.6 + capitalFit * 0.4`, and capitalFit is
 * `capital / (capital + 5000)` - both from buildReport. Reconstructing the
 * score from insight's headroom and asserting it equals the engine's is the
 * strongest available check that the two are still the same quantity.
 */
test('the insight headroom still tracks the score', () => {
  for (const patch of [{}, { capital: 12000 }, { business: 'grocery' }, { radiusKm: 10 }]) {
    const s = session(patch);
    const c = caseFrom(s);
    const i = insight(c);
    const rebuilt = Math.round((i.headroom * 0.6 + (s.capital / (s.capital + 5000)) * 0.4) * 100);
    assert.equal(rebuilt, c.report.score, `headroom drifted for ${JSON.stringify(patch)}`);
  }
});

test('the insight reading follows the numbers rather than being fixed', () => {
  // Village varies as well as business: at one village every trade can land in
  // the same band quite legitimately, and a test that only swapped the trade
  // would have passed on a hardcoded reading.
  const readings = new Set(
    [
      { village: 'bijpur', business: 'grocery' },
      { village: 'jarha', business: 'tailoring' },
      { village: 'kutku', business: 'leaf-plates' },
    ].map((patch) => insight(caseFrom(session(patch))).reading),
  );
  assert.ok(readings.size > 1, `every business read the same: ${[...readings]}`);
});

test('insight carries the capital-margin shortfall, and only when there is one', () => {
  assert.equal(insight(caseFrom(session())).margin, null);
  assert.equal(insight(caseFrom(session({ capital: 12000 }))).margin.requiredMargin, 18000);
});

test('no report means no insight, rather than an empty one', () => {
  assert.equal(insight(caseFrom(session({ village: null }))), null);
});

console.log(`\n${n} case tests passed`);
