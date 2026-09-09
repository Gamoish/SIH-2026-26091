import assert from 'node:assert';
import {
  planLoan,
  emiFor,
  compareAgainst,
  isGap,
  MIN_CAPITAL,
  projectCostFor,
} from '../src/domain/finance.ts';
import { SCHEMES, schemeFor, selectTier, rateRange } from '../src/domain/schemes.ts';
import { MOCK_BUSINESSES } from '../src/data/fixtures/businesses.ts';

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

test('routes ST to NSTFDC and SC to NSFDC', () => {
  assert.equal(schemeFor('ST').code, 'NSTFDC');
  assert.equal(schemeFor('SC').code, 'NSFDC');
  assert.equal(schemeFor('OBC').code, 'NBCFDC');
  assert.equal(schemeFor('GEN'), null);
});

test('the demo case: a ₹1,80,000 leaf-plate unit on ₹22,000 of ST capital', () => {
  const p = planLoan(22000, 'ST', 'leaf-plates');
  assert.ok(!isGap(p));
  assert.equal(p.scheme.code, 'NSTFDC');
  // The anchor cost of a leaf-plate unit, NOT the capital grossed up. Rs
  // 22,000 at 10% used to make this a Rs 2,20,000 project - which is a
  // carpentry workshop's price tag, not a plate press's.
  assert.equal(p.projectCost, 180000);
  assert.equal(p.projectCost, MOCK_BUSINESSES['leaf-plates'].anchorCost);
  assert.equal(p.loanAmount, 180000 - 22000);
  assert.equal(p.requiredMargin, 18000);
  assert.equal(p.emi, 2525);
  // NSTFDC bands by LOAN: Rs 1,58,000 sits in the first slab.
  assert.equal(p.tier.name.en, 'Up to ₹5 lakh');
  assert.equal(p.interestPct, 6);
  assert.equal(p.tenureMonths, 84);
  assert.equal(p.moratoriumMonths, 6);
  assert.equal(p.instalmentCount, 78);
});

test('the required margin comes from the scheme row, not a constant', () => {
  const row = { ...schemeFor('ST'), beneficiaryPct: 25 };
  const saved = SCHEMES.findIndex((s) => s.code === 'NSTFDC');
  SCHEMES[saved] = row;
  const p = planLoan(22000, 'ST', 'leaf-plates');
  // The project still costs what the press costs. The scheme's percent moves
  // the borrower's share of it, not the price of the equipment.
  assert.equal(p.projectCost, 180000);
  assert.equal(p.requiredMargin, 45000);
  SCHEMES[saved] = { ...row, beneficiaryPct: 10 };
});

test('the project cost is the business, and the capital is the margin against it', () => {
  // Two businesses at one capital: a formula derived from capital cannot tell
  // them apart, so this is the test that would have failed before the change.
  for (const id of ['leaf-plates', 'tailoring']) {
    const anchor = MOCK_BUSINESSES[id].anchorCost;
    const p = planLoan(22000, 'ST', id);
    assert.equal(p.projectCost, anchor, `${id} project cost must be its anchor`);
    assert.equal(p.projectCost, projectCostFor(id));
    assert.equal(p.loanAmount, anchor - 22000, `${id} loan must be the gap`);
    assert.equal(p.requiredMargin, Math.round(anchor * 0.1));
  }
  assert.notEqual(
    planLoan(22000, 'ST', 'leaf-plates').projectCost,
    planLoan(22000, 'ST', 'tailoring').projectCost,
  );

  // and one business at two capitals costs the same to set up
  assert.equal(
    planLoan(5_000, 'ST', 'grocery').projectCost,
    planLoan(90_000, 'ST', 'grocery').projectCost,
  );
});

test('over-contributing borrows less, and never borrows a negative amount', () => {
  const anchor = MOCK_BUSINESSES.tailoring.anchorCost; // Rs 90,000, margin Rs 9,000

  // Well past the Rs 9,000 the scheme asks for. The loan shrinks rather than
  // being pinned to the scheme's 90% financing share - over-contributing is
  // allowed, and this is what it looks like.
  const over = planLoan(40_000, 'ST', 'tailoring');
  assert.equal(over.projectCost, anchor);
  assert.equal(over.loanAmount, anchor - 40_000);
  assert.ok(over.loanAmount < anchor * 0.9, 'over-contributing must borrow under the max share');
  assert.ok(over.capital > over.requiredMargin);

  // capital past the whole project cost: no loan, not a negative one
  const fully = planLoan(120_000, 'ST', 'tailoring');
  assert.equal(fully.loanAmount, 0);
  assert.equal(fully.projectCost, anchor);
});

test('an unconfirmed scheme yields a visible gap, never a guessed number', () => {
  const p = planLoan(22000, 'OBC', 'leaf-plates');
  assert.ok(isGap(p), 'NBCFDC has no confirmed rate — must not produce a plan');
  assert.equal(p.scheme.code, 'NBCFDC');
  assert.deepEqual(p.missing, ['beneficiaryPct', 'interestPct', 'tenureMonths', 'moratoriumMonths']);
  assert.equal(p.reason, 'unsourced');
});

test('the amortisation actually amortises: balance reaches zero', () => {
  const p = planLoan(22000, 'ST', 'leaf-plates');
  assert.equal(p.years.at(-1).balance, 0, 'loan must be fully repaid at end of tenure');
  assert.equal(p.years.length, 7, '84 months = 7 year rows');
  assert.equal(p.years[0].instalments, 6, 'year 1 pays only 6 of its 12 months');
  assert.ok(p.years[0].hasGrace);
  assert.equal(p.years[1].instalments, 12);
});

test('no instalment falls due during the moratorium', () => {
  const p = planLoan(22000, 'ST', 'leaf-plates');
  const paidInYear1 = p.years[0].paid;
  assert.ok(paidInYear1 < p.emi * 12, 'year 1 cannot carry 12 instalments');
  assert.equal(Math.round(paidInYear1 / p.emi), 6);
});

test('total repaid exceeds the loan by exactly the interest', () => {
  const p = planLoan(22000, 'ST', 'leaf-plates');
  assert.equal(p.totalRepaid - p.loanAmount, p.totalInterest);
  assert.ok(p.totalInterest > 0);
  assert.ok(p.totalInterest > 35000 && p.totalInterest < 60000, `got ${p.totalInterest}`);
});

test('EMI follows the loan, and is not a fixed demo number', () => {
  // The project cost is fixed by the business now, so more of the applicant's
  // own money means a SMALLER loan and a smaller instalment - the opposite of
  // the old gross-up, and the right way round.
  const small = planLoan(11000, 'ST', 'leaf-plates');
  const big = planLoan(44000, 'ST', 'leaf-plates');
  assert.ok(big.emi < small.emi, 'more capital must mean a smaller instalment');
  assert.equal(small.loanAmount - big.loanAmount, 33000);
  assert.notEqual(small.emi, 5270);

  // and it follows the business too, at one fixed capital
  assert.ok(planLoan(22000, 'ST', 'carpentry').emi > planLoan(22000, 'ST', 'tailoring').emi);
});

test('a concessional scheme beats a commercial rate', () => {
  const p = planLoan(22000, 'ST', 'leaf-plates');
  const bank = compareAgainst(p, 11);
  assert.ok(bank.saved > 0, 'a 6% scheme must cost less than an 11% bank loan');
  assert.ok(bank.emi > p.emi);
});

test('emiFor handles a zero-interest scheme without dividing by zero', () => {
  assert.equal(emiFor(1200, 0, 12), 100);
  assert.equal(emiFor(1000, 5, 0), 0);
});

test('NSFDC picks its tier by PROJECT COST - now the business, not the capital', () => {
  // Tailoring is the one anchor (Rs 90,000) inside NSFDC's Rs 1,40,000 Micro
  // Finance band; every other business sits above it on the Term Loan.
  const mfs = planLoan(14_000, 'SC', 'tailoring');
  assert.equal(mfs.tier.name.en, 'Micro Finance Scheme');
  assert.equal(mfs.interestPct, 6.5);
  assert.equal(mfs.tenureMonths, 36);
  assert.equal(mfs.moratoriumMonths, 3);

  const term = planLoan(14_000, 'SC', 'grocery');
  assert.equal(term.tier.name.en, 'Term Loan');
  assert.equal(term.interestPct, 8);
  assert.equal(term.tenureMonths, 84);
  assert.equal(term.moratoriumMonths, 6);

  // the boundary is on the project, and the project no longer moves with
  // capital - so one business keeps its tier at every capital
  assert.ok(mfs.projectCost <= 140_000);
  assert.ok(term.projectCost > 140_000);
  assert.equal(planLoan(2_000, 'SC', 'tailoring').tier.name.en, 'Micro Finance Scheme');
  assert.equal(planLoan(80_000, 'SC', 'tailoring').tier.name.en, 'Micro Finance Scheme');

  // the exact-rupee reading of the boundary is asserted on selectTier below,
  // which is where it lives now that no capital can walk a project across it.
});

test('no anchor cost reaches a tier loan cap or a scheme ceiling today', () => {
  // Both used to be live paths, reached by grossing capital up to Rs 50 lakh.
  // With the project pinned to a Rs 90,000-2,20,000 anchor, neither is - and
  // saying so out loud beats leaving a test that has quietly stopped meaning
  // anything. Raise an anchor past either limit and this is the alarm.
  for (const id of Object.keys(MOCK_BUSINESSES)) {
    for (const social of ['SC', 'ST']) {
      const p = planLoan(MIN_CAPITAL, social, id);
      assert.ok(!isGap(p), `${social}/${id} must find a tier`);
      assert.equal(p.projectCost, MOCK_BUSINESSES[id].anchorCost);
      if (p.tier.maxLoan != null) {
        assert.ok(p.loanAmount < p.tier.maxLoan, `${social}/${id} now hits the tier loan cap`);
      }
    }
  }
});

test('NSTFDC picks its tier by LOAN AMOUNT, and every anchor lands in slab 1', () => {
  // The largest loan the fixtures can produce is a Rs 2,20,000 carpentry
  // workshop on the Rs 2,000 floor - well inside the Rs 5,00,000 slab. The
  // exact slab boundaries are asserted on selectTier below.
  for (const id of Object.keys(MOCK_BUSINESSES)) {
    const p = planLoan(MIN_CAPITAL, 'ST', id);
    assert.ok(p.loanAmount <= 500_000);
    assert.equal(p.interestPct, 6, `${id} should price in NSTFDC's first slab`);
  }
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
    const under = planLoan(MIN_CAPITAL - 1, social, 'leaf-plates');
    assert.ok(isGap(under), `${social} should refuse below the floor`);
    assert.equal(under.reason, 'below-minimum');
    assert.equal(under.missing.length, 0, 'nothing is missing - the input is too small');
    assert.ok(under.scheme, 'the scheme is still known, so the screen can name it');

    // exactly the floor still plans, and the project cost is unmoved by it
    const at = planLoan(MIN_CAPITAL, social, 'leaf-plates');
    assert.ok(!isGap(at), `${social} must plan at exactly the floor`);
    assert.equal(at.projectCost, MOCK_BUSINESSES['leaf-plates'].anchorCost);
  }
  // the Rs 40 case that used to produce a Rs 400 "project"
  assert.equal(planLoan(40, 'ST', 'leaf-plates').reason, 'below-minimum');
});

console.log(`\nOK — ${n} finance checks passed.`);
