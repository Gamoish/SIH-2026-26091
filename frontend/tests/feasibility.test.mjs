import assert from 'node:assert';
import {
  buildReport,
  betterAlternatives,
  capitalFitFor,
  costBreakdown,
  rankBetterBusinesses,
} from '../src/domain/feasibility.ts';
import { planLoan, projectCostFor, isGap } from '../src/domain/finance.ts';
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

test('the estimate is the lower of the two ceilings, and never above capacity', () => {
  // The demo walkthrough - Jarha, 10 km, leaf-plates - is market-limited: a
  // Rs 1,80,000 plate unit can outrun a 35,000-person catchment that already
  // has six presses.
  assert.equal(report().revenueLimitedBy, 'market');

  // The capacity ceiling is still applied, and is now a property of the
  // BUSINESS rather than of the applicant: the project cost no longer moves
  // with capital, so neither does this. Asserted across the whole fixture
  // space rather than through one hand-picked case.
  //
  // NOTE: no fixture combination is capacity-limited today - every anchor buys
  // more throughput than its local market will absorb. The branch stays
  // because min() of two real ceilings is the right model and the anchors are
  // data, but the 'capacity' verdict is currently unreachable from fixtures.
  for (const v of MOCK_VILLAGES) {
    for (const b of Object.values(MOCK_BUSINESSES)) {
      for (const radiusKm of [0, 5, 10, 20]) {
        const r = buildReport({ villageId: v.id, businessId: b.id, radiusKm, capital: 22000 });
        const working = b.costSplit.reduce((n, c) => n + (c.working ? c.share : 0), 0);
        const capacity = b.anchorCost * working * b.workingCapitalTurns;
        assert.ok(r.estimatedAnnualRevenue <= Math.round(capacity), `${v.id}/${b.id} above capacity`);
        assert.equal(r.revenueLimitedBy, 'market', `${v.id}/${b.id} is no longer market-limited`);
      }
    }
  }

  // and capital genuinely does not touch revenue any more
  assert.equal(report({ capital: 2000 }).estimatedAnnualRevenue, report().estimatedAnnualRevenue);
});

test('grocery differs between villages of similar size', () => {
  const grocery = (villageId) => report({ villageId, businessId: 'grocery' }).estimatedAnnualRevenue;
  // Bijpur is bigger than Ranitali but shops in town; without the spend index
  // these two came out within a few hundred rupees of each other.
  assert.notEqual(grocery('bijpur'), grocery('ranitali'));
  assert.ok(grocery('dudhi') > grocery('kutku'), 'the block town should out-spend Kutku');
});

test('feasibility and finance agree on project cost, for every usable scheme', () => {
  // SC -> NSFDC, ST -> NSTFDC. OBC/NBCFDC has no confirmed contribution percent
  // and is a PlanGap, so there is no project cost to agree on.
  for (const social of ['SC', 'ST']) {
    for (const businessId of Object.keys(MOCK_BUSINESSES)) {
      for (const capital of [2000, 22000, 150000, 499000]) {
        const plan = planLoan(capital, social, businessId);
        assert.ok(!isGap(plan), `${social} should have a usable scheme`);
        // Both sides read projectCostFor, so they cannot drift apart - and the
        // figure is the business's anchor, at every capital.
        assert.equal(plan.projectCost, projectCostFor(businessId));
        assert.equal(plan.projectCost, MOCK_BUSINESSES[businessId].anchorCost);
        assert.equal(
          plan.projectCost,
          buildReport({ villageId: 'jarha', businessId, radiusKm: 10, capital }).projectCost,
          `${social}/${businessId} @ ${capital}`,
        );
      }
    }
  }
  assert.ok(isGap(planLoan(22000, 'OBC', 'leaf-plates')));
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

test('capital score has no cliff and no plateau', () => {
  const score = (capital) => report({ capital }).score;

  // No discontinuity anywhere across the old Rs 20,000 threshold. One point is
  // the rounding step, so a judge putting Rs 19,999 next to Rs 20,001 cannot
  // find a jump to point at.
  for (let c = 15000; c <= 25000; c++) {
    assert.ok(Math.abs(score(c) - score(c - 1)) <= 1, `jump at Rs ${c}`);
  }
  assert.equal(score(19999), score(20001));

  // And no plateau above it: more capital always scores strictly higher, which
  // `min(1, capital / 20000)` did not do - it pinned everything above the
  // threshold to the same number.
  const rungs = [20000, 50000, 100000, 250000, 500000];
  for (let i = 1; i < rungs.length; i++) {
    assert.ok(score(rungs[i]) > score(rungs[i - 1]), `flat between ${rungs[i - 1]} and ${rungs[i]}`);
  }
});

test('the demo walkthrough still reads as it did', () => {
  const r = report();
  assert.equal(r.estimatedAnnualRevenue, 157153);
  assert.equal(r.revenueLimitedBy, 'market');
  assert.equal(r.verdict, 'good');
});

// Kutku, leaf-plates, 10 km, Rs 22,000 -> score 41, the worst fixture combo at
// the demo capital: one press already running in a village of 1,900.
const LOW = { villageId: 'kutku', businessId: 'leaf-plates', radiusKm: 10, capital: 22000 };

test('a low-scoring pick is offered better businesses', () => {
  const current = buildReport(LOW);
  assert.equal(current.verdict, 'check');

  const alts = betterAlternatives(LOW);
  assert.ok(alts.length > 0, 'a check verdict with better options should offer them');

  // never recommends what they already picked
  assert.ok(!alts.some((a) => a.business.id === LOW.businessId), 'recommended the current pick');
  // strictly better, never equal or worse
  for (const a of alts) assert.ok(a.score > current.score, `${a.business.id} scores ${a.score}`);
  // descending
  for (let i = 1; i < alts.length; i++) assert.ok(alts[i - 1].score >= alts[i].score, 'out of order');
  // no duplicates
  assert.equal(new Set(alts.map((a) => a.business.id)).size, alts.length);
  // and each score is the real report's score for that business
  for (const a of alts) {
    assert.equal(a.score, buildReport({ ...LOW, businessId: a.business.id }).score);
  }
});

test('no recommendation is forced where there is nothing better', () => {
  // A good verdict is never talked out of, however the alternatives score.
  assert.equal(report().verdict, 'good');
  assert.deepEqual(betterAlternatives({ ...LOW, ...{ villageId: 'jarha' } }).length, 0);

  // Rs 2,000 at Kutku: every business is capital-limited into a check verdict,
  // so anything genuinely better still has to out-score the current pick.
  for (const a of betterAlternatives({ ...LOW, capital: 2000 })) {
    assert.ok(a.score > buildReport({ ...LOW, capital: 2000 }).score);
  }
});

test('recommendations stay absent for a village with no report', () => {
  // Not an error, just nothing - same as the report itself.
  assert.deepEqual(betterAlternatives({ ...LOW, villageId: 'lgd-123456' }), []);
});

test('the cost breakdown is the chosen business, never a default', () => {
  // Each business is now broken down over its OWN project cost - a leaf-plate
  // unit is Rs 1,80,000 and a grocery is Rs 1,50,000, where both used to be
  // whatever the applicant's capital grossed up to.
  //
  // Literal expectations, not `MOCK_BUSINESSES[id].costSplit` echoed back: if
  // the screen ever fell back to one business for all of them, comparing
  // against the fixture would happily agree with itself. Two businesses, so a
  // single hardcoded default cannot satisfy both.
  const EXPECTED = {
    'leaf-plates': [
      ['Plate machines', 106200],
      ['Shed + power', 32400],
      ['Leaves + working', 41400],
    ],
    grocery: [
      ['Opening stock', 82500],
      ['Shop + shelving', 40500],
      ['Working capital', 27000],
    ],
  };

  for (const [id, rows] of Object.entries(EXPECTED)) {
    const cost = planLoan(22000, 'ST', id).projectCost;
    const got = costBreakdown(cost, MOCK_BUSINESSES[id]);
    assert.deepEqual(
      got.map((c) => [c.label.en, c.amount]),
      rows,
      `${id} breakdown`,
    );
    // every line carries a Hindi label too - the screens localise it themselves
    for (const c of got) assert.ok(c.label.hi && c.label.hi !== c.label.en, `${id} missing hi label`);
    // and the parts add up to the whole they were split from
    assert.equal(
      got.reduce((n, c) => n + c.amount, 0),
      cost,
      `${id} lines do not sum to the project cost`,
    );
  }

  // the two must not be interchangeable - that is the bug this guards
  assert.notDeepEqual(
    costBreakdown(180_000, MOCK_BUSINESSES['leaf-plates']).map((c) => c.label.en),
    costBreakdown(180_000, MOCK_BUSINESSES.grocery).map((c) => c.label.en),
  );
});

test('the breakdown is driven by the shared project cost, for every business', () => {
  // Both capital screens call costBreakdown(plan.projectCost, business), and
  // plan.projectCost comes from projectCostFor - so this is the same chain
  // both layouts render, asserted once.
  for (const capital of [2000, 22000]) {
    for (const b of Object.values(MOCK_BUSINESSES)) {
      const plan = planLoan(capital, 'ST', b.id);
      assert.equal(plan.projectCost, projectCostFor(b.id));
      const lines = costBreakdown(plan.projectCost, b);
      assert.equal(lines.length, b.costSplit.length);
      assert.equal(
        lines.reduce((n, c) => n + c.amount, 0),
        plan.projectCost,
        `${b.id} @ ${capital}`,
      );
    }
  }
});

test('a real LGD village still returns nothing', () => {
  assert.equal(report({ villageId: 'lgd-123456' }), null);
});

test('the margin note fires when capital is under the required contribution', () => {
  const at = (businessId, capital) =>
    capitalFitFor({ villageId: 'jarha', businessId, radiusKm: 10, capital });

  // Two businesses with different anchors, so one shared threshold cannot
  // accidentally satisfy both. At the 10% default contribution: leaf-plates
  // Rs 1,80,000 -> Rs 18,000 of margin; tailoring Rs 90,000 -> Rs 9,000.
  assert.equal(MOCK_BUSINESSES['leaf-plates'].anchorCost, 180_000);
  assert.equal(MOCK_BUSINESSES.tailoring.anchorCost, 90_000);

  // BOUNDARY, exact: at the required margin there is no note; one rupee under
  // there is. Both businesses, so the boundary is per business.
  assert.equal(at('leaf-plates', 18_000), null, 'exactly the margin must not warn');
  assert.ok(at('leaf-plates', 17_999), 'a rupee under the margin must warn');
  assert.equal(at('tailoring', 9_000), null, 'exactly the margin must not warn');
  assert.ok(at('tailoring', 8_999), 'a rupee under the margin must warn');

  // comfortably above, both businesses
  assert.equal(at('leaf-plates', 50_000), null);
  assert.equal(at('tailoring', 50_000), null);

  // the same capital can be short for one business and fine for another -
  // proof the threshold is per business, not one global number
  assert.ok(at('leaf-plates', 10_000), 'Rs 10,000 is under a plate unit\'s Rs 18,000 margin');
  assert.equal(at('tailoring', 10_000), null, 'Rs 10,000 clears tailoring\'s Rs 9,000');

  // and it reports the figures it judged on
  const tight = at('leaf-plates', 10_000);
  assert.equal(tight.anchorCost, 180_000);
  assert.equal(tight.requiredMargin, 18_000);
  assert.equal(tight.capital, 10_000);
  assert.equal(tight.business.id, 'leaf-plates');
  assert.ok(tight.capital < tight.requiredMargin);
});

test('the note reads the margin off the scheme, not off a hardcoded 10%', () => {
  const opts = { villageId: 'jarha', businessId: 'leaf-plates', radiusKm: 10, capital: 22_000 };
  // Rs 22,000 clears the 10% margin on a Rs 1,80,000 project, and does not
  // clear a 25% one. Same capital, same business, different scheme row.
  assert.equal(capitalFitFor(opts, 10), null);
  const strict = capitalFitFor(opts, 25);
  assert.ok(strict);
  assert.equal(strict.requiredMargin, 45_000);
});

test('the note never suggests a business the money cannot margin either', () => {
  const fit = capitalFitFor({
    villageId: 'ranitali',
    businessId: 'carpentry',
    radiusKm: 10,
    capital: 12_000,
  });
  assert.ok(fit, 'Rs 12,000 is under carpentry\'s Rs 22,000 margin');
  assert.ok(fit.alternatives.length > 0, 'this case should have something to offer');
  for (const a of fit.alternatives) {
    assert.ok(
      fit.capital >= a.business.anchorCost * 0.1,
      `${a.business.id} is itself out of reach at this capital`,
    );
  }
});

test('the note reuses the report ranking rather than a second one', () => {
  const opts = { villageId: 'ranitali', businessId: 'carpentry', radiusKm: 10, capital: 12_000 };
  const ranked = rankBetterBusinesses(opts);
  const fit = capitalFitFor(opts);
  // the note's list is the shared ranking, filtered - never reordered, never
  // padded with something the ranking did not return
  assert.deepEqual(
    fit.alternatives.map((a) => a.business.id),
    ranked.filter((a) => fit.capital >= a.business.anchorCost * 0.1).map((a) => a.business.id),
  );
  for (const a of fit.alternatives) assert.ok(ranked.some((r) => r.business.id === a.business.id));
});

test('the demo walkthrough does NOT trigger the capital note', () => {
  const fit = capitalFitFor(
    { villageId: 'jarha', businessId: 'leaf-plates', radiusKm: 10, capital: 22_000 },
    planLoan(22_000, 'ST', 'leaf-plates').beneficiaryPct,
  );
  // Rs 22,000 against the Rs 18,000 NSTFDC asks for on a Rs 1,80,000 plate
  // unit - clears it, so the locked walkthrough is unchanged.
  assert.equal(fit, null);
});

test('the locked demo score and revenue survive the anchor change', () => {
  // The point of this test is coupling, not the numbers themselves: capitalFit
  // reads raw capital and revenue is min(demand, capacity), so moving the
  // project cost off capital must not move either of these.
  const r = report();
  assert.equal(r.score, 75);
  assert.equal(r.estimatedAnnualRevenue, 157153);
  assert.equal(r.revenueLimitedBy, 'market');
  assert.equal(r.verdict, 'good');
  // and the money side of the same walkthrough
  const plan = planLoan(22_000, 'ST', 'leaf-plates');
  assert.equal(plan.projectCost, 180_000);
  assert.equal(plan.requiredMargin, 18_000);
  assert.equal(plan.loanAmount, 158_000);
  assert.equal(plan.emi, 2525);
});

test('every business carries an anchor the note can judge against', () => {
  for (const b of Object.values(MOCK_BUSINESSES)) {
    assert.equal(typeof b.anchorCost, 'number', `${b.id} has no anchorCost`);
    assert.ok(b.anchorCost > 0);
  }
});

console.log(`\n${n} feasibility tests passed`);
