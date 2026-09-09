import assert from 'node:assert';
import { planLoan, emiFor, compareAgainst, isGap, MIN_CAPITAL } from '../src/domain/finance.ts';
import { SCHEMES, schemeFor, selectTier, rateRange } from '../src/domain/schemes.ts';

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
  // NSTFDC bands by LOAN: Rs 1,98,000 sits in the first slab.
  assert.equal(p.tier.name.en, 'Up to ₹5 lakh');
  assert.equal(p.interestPct, 6);
  assert.equal(p.tenureMonths, 84);
  assert.equal(p.moratoriumMonths, 6);
  assert.equal(p.instalmentCount, 78);
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
  assert.deepEqual(p.missing, ['beneficiaryPct', 'interestPct', 'tenureMonths', 'moratoriumMonths']);
  assert.equal(p.reason, 'unsourced');
});

test('the amortisation actually amortises: balance reaches zero', () => {
  const p = planLoan(22000, 'ST');
  assert.equal(p.years.at(-1).balance, 0, 'loan must be fully repaid at end of tenure');
  assert.equal(p.years.length, 7, '84 months = 7 year rows');
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
  assert.ok(p.totalInterest > 35000 && p.totalInterest < 60000, `got ${p.totalInterest}`);
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

test('NSFDC picks its tier by PROJECT COST, at the exact boundary', () => {
  // 10% contribution, so capital x 10 is the project cost.
  // A Rs 1,40,000 project (Rs 14,000 capital) is the last rupee of Micro Finance.
  const mfs = planLoan(14_000, 'SC');
  assert.equal(mfs.tier.name.en, 'Micro Finance Scheme');
  assert.equal(mfs.interestPct, 6.5);
  assert.equal(mfs.tenureMonths, 36);
  assert.equal(mfs.moratoriumMonths, 3);

  // one rupee of capital more crosses into the Term Loan
  const term = planLoan(14_001, 'SC');
  assert.equal(term.tier.name.en, 'Term Loan');
  assert.equal(term.interestPct, 8);
  assert.equal(term.tenureMonths, 84);
  assert.equal(term.moratoriumMonths, 6);

  // and the boundary is on the project, not the loan
  assert.ok(mfs.projectCost <= 140_000);
  assert.ok(term.projectCost > 140_000);
});

test('the Micro Finance loan ceiling binds before its band does', () => {
  // 90% of a Rs 1,40,000 project is Rs 1,26,000, but MFS lends at most Rs 1,25,000.
  const p = planLoan(14_000, 'SC');
  assert.equal(p.loanAmount, 125_000, 'the Rs 1,25,000 cap must hold');
  assert.equal(p.projectCost, p.capital + p.loanAmount, 'cost must equal what the money buys');
  // clamping only lowers the cost, so it cannot bump the project into a tier
  assert.equal(p.tier.name.en, 'Micro Finance Scheme');
});

test('NSFDC stops at its Rs 50,00,000 ceiling instead of inventing terms', () => {
  assert.equal(planLoan(500_000, 'SC').projectCost, 5_000_000);
  const over = planLoan(500_001, 'SC');
  assert.ok(isGap(over));
  assert.equal(over.reason, 'above-ceiling');
});

test('NSTFDC picks its tier by LOAN AMOUNT, at the exact boundaries', () => {
  // loan = 90% of the project = 9x capital, so Rs 5,00,000 of loan is
  // Rs 55,555.55 of capital: 55,555 -> 4,99,995 (slab 1), 55,556 -> 5,00,004.
  const slab1 = planLoan(55_555, 'ST');
  assert.equal(slab1.loanAmount, 499_995);
  assert.equal(slab1.interestPct, 6);

  const slab2 = planLoan(55_556, 'ST');
  assert.equal(slab2.loanAmount, 500_004);
  assert.equal(slab2.interestPct, 8);

  const stillSlab2 = planLoan(111_111, 'ST');
  assert.equal(stillSlab2.loanAmount, 999_999);
  assert.equal(stillSlab2.interestPct, 8);

  const slab3 = planLoan(111_112, 'ST');
  assert.equal(slab3.loanAmount, 1_000_008);
  assert.equal(slab3.interestPct, 10);
});

test('selectTier reads the boundary as inclusive, on both bases', () => {
  const nsfdc = schemeFor('SC');
  assert.equal(selectTier(nsfdc, 140_000).name.en, 'Micro Finance Scheme');
  assert.equal(selectTier(nsfdc, 140_001).name.en, 'Term Loan');
  assert.equal(selectTier(nsfdc, 5_000_000).name.en, 'Term Loan');
  assert.equal(selectTier(nsfdc, 5_000_001), null);

  const nstfdc = schemeFor('ST');
  assert.equal(selectTier(nstfdc, 500_000).interestPct, 6);
  assert.equal(selectTier(nstfdc, 500_001).interestPct, 8);
  assert.equal(selectTier(nstfdc, 1_000_000).interestPct, 8);
  assert.equal(selectTier(nstfdc, 1_000_001).interestPct, 10);

  // an unsourced scheme has no tiers, and therefore no rate to quote
  assert.equal(selectTier(schemeFor('OBC'), 100_000), null);
  assert.equal(rateRange(schemeFor('OBC')), null);
  assert.equal(rateRange(nsfdc), '6.5–8%');
  assert.equal(rateRange(nstfdc), '6–10%');
});

test('capital below the floor is refused, not calculated', () => {
  for (const social of ['SC', 'ST']) {
    const under = planLoan(MIN_CAPITAL - 1, social);
    assert.ok(isGap(under), `${social} should refuse below the floor`);
    assert.equal(under.reason, 'below-minimum');
    assert.equal(under.missing.length, 0, 'nothing is missing - the input is too small');
    assert.ok(under.scheme, 'the scheme is still known, so the screen can name it');

    // exactly the floor still plans
    const at = planLoan(MIN_CAPITAL, social);
    assert.ok(!isGap(at), `${social} must plan at exactly the floor`);
    assert.equal(at.projectCost, MIN_CAPITAL * 10);
  }
  // the Rs 40 case that used to produce a Rs 400 "project"
  assert.equal(planLoan(40, 'ST').reason, 'below-minimum');
});

console.log(`\nOK — ${n} finance checks passed.`);
