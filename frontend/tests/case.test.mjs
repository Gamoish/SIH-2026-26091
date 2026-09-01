import assert from 'node:assert';
import { caseFrom, emiShare } from '../src/domain/case.ts';
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
  assert.equal(plan.projectCost, 220000);
  assert.equal(plan.loanAmount, 198000);
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

console.log(`\n${n} case tests passed`);
