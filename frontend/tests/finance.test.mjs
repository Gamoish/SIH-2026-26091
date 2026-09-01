import assert from 'node:assert';
import { planLoan, emiFor, compareAgainst, isGap } from '../src/domain/finance.ts';
import { SCHEMES, schemeFor } from '../src/domain/schemes.ts';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

test('routes ST to NSTFDC and SC to NSFDC', () => {
  assert.equal(schemeFor('ST').code, 'NSTFDC');
  assert.equal(schemeFor('SC').code, 'NSFDC');
  assert.equal(schemeFor('OBC').code, 'NBCFDC');
  assert.equal(schemeFor('GEN'), null);
});

test('the demo case: ₹22,000 of ST capital becomes a ₹2,20,000 project', () => {
  const p = planLoan(22000, 'ST');
  assert.ok(!isGap(p));
  assert.equal(p.scheme.code, 'NSTFDC');
  assert.equal(p.projectCost, 220000);
  assert.equal(p.loanAmount, 198000);
  assert.equal(p.interestPct, 6);
  assert.equal(p.tenureMonths, 48);
  assert.equal(p.moratoriumMonths, 6);
  assert.equal(p.instalmentCount, 42);
});

test('the contribution split comes from the scheme row, not a constant', () => {
  const row = { ...schemeFor('ST'), beneficiaryPct: 25 };
  const saved = SCHEMES.findIndex((s) => s.code === 'NSTFDC');
  SCHEMES[saved] = row;
  const p = planLoan(22000, 'ST');
  assert.equal(p.projectCost, 88000);
  assert.equal(p.loanAmount, 66000);
  SCHEMES[saved] = { ...row, beneficiaryPct: 10 };
});

test('an unconfirmed scheme yields a visible gap, never a guessed number', () => {
  const p = planLoan(22000, 'OBC');
  assert.ok(isGap(p), 'NBCFDC has no confirmed rate — must not produce a plan');
  assert.equal(p.scheme.code, 'NBCFDC');
  assert.deepEqual(p.missing, ['interestPct', 'tenureMonths', 'moratoriumMonths', 'beneficiaryPct']);
});

test('the amortisation actually amortises: balance reaches zero', () => {
  const p = planLoan(22000, 'ST');
  assert.equal(p.years.at(-1).balance, 0, 'loan must be fully repaid at end of tenure');
  assert.equal(p.years.length, 4, '48 months = 4 year rows');
  assert.equal(p.years[0].instalments, 6, 'year 1 pays only 6 of its 12 months');
  assert.ok(p.years[0].hasGrace);
  assert.equal(p.years[1].instalments, 12);
});

test('no instalment falls due during the moratorium', () => {
  const p = planLoan(22000, 'ST');
  const paidInYear1 = p.years[0].paid;
  assert.ok(paidInYear1 < p.emi * 12, 'year 1 cannot carry 12 instalments');
  assert.equal(Math.round(paidInYear1 / p.emi), 6);
});

test('total repaid exceeds the loan by exactly the interest', () => {
  const p = planLoan(22000, 'ST');
  assert.equal(p.totalRepaid - p.loanAmount, p.totalInterest);
  assert.ok(p.totalInterest > 0);
  assert.ok(p.totalInterest > 20000 && p.totalInterest < 45000, `got ${p.totalInterest}`);
});

test('EMI scales with capital, and is not a fixed demo number', () => {
  const small = planLoan(11000, 'ST');
  const big = planLoan(44000, 'ST');
  assert.ok(big.emi > small.emi * 3.5, 'four times the capital, roughly four times the EMI');
  assert.notEqual(small.emi, 5270);
});

test('a concessional scheme beats a commercial rate', () => {
  const p = planLoan(22000, 'ST');
  const bank = compareAgainst(p, 11);
  assert.ok(bank.saved > 0, 'a 6% scheme must cost less than an 11% bank loan');
  assert.ok(bank.emi > p.emi);
});

test('emiFor handles a zero-interest scheme without dividing by zero', () => {
  assert.equal(emiFor(1200, 0, 12), 100);
  assert.equal(emiFor(1000, 5, 0), 0);
});

console.log(`\nOK — ${n} finance checks passed.`);
