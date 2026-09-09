import type { Bilingual, BusinessId, Lang } from '../types/index.ts';
import { MOCK_VILLAGES, distanceKm, type MockVillage } from '../data/fixtures/villages.ts';
import {
  MOCK_BUSINESSES,
  MOCK_COMPETITOR_COUNTS,
  MOCK_GROCERY_SPEND_INDEX,
  type MockBusiness,
} from '../data/fixtures/businesses.ts';
import { projectCostFrom } from './finance.ts';

const pick = (t: Bilingual, lang: Lang) => (lang === 'en' ? t.en : t.hi);

export type CompetitorRow = { name: Bilingual; km: number; count: number; isYours: boolean };

export type FeasibilityReport = {
  village: MockVillage;
  business: MockBusiness;
  radiusKm: number;
  marketReach: { villages: number; households: number; population: number };
  competitors: CompetitorRow[];
  totalCompetitors: number;
  peoplePerCompetitor: number;
  pricing: { suggested: number; low: number; high: number };
  score: number;
  verdict: 'good' | 'check';
  limiter: 'thin-market' | 'crowded' | 'none';
  estimatedAnnualRevenue: number;
  /** Which of the two ceilings the revenue estimate actually hit. */
  revenueLimitedBy: 'market' | 'capital';
  /**
   * The same figure the loan plan calls `projectCost`, from the same shared
   * function. Exposed so the two can be asserted equal rather than each
   * recomputing it - that is how they used to drift.
   */
  projectCost: number;
  swot: { strengths: Bilingual[]; weaknesses: Bilingual[]; opportunities: Bilingual[]; threats: Bilingual[] };
};

/** Hand-authored per village, see MOCK_COMPETITOR_COUNTS. Non-fixture villages
 *  never reach here - buildReport returns null for them first. */
function competitorsIn(v: MockVillage, b: MockBusiness): number {
  return MOCK_COMPETITOR_COUNTS[v.id]?.[b.id] ?? 0;
}

export function buildReport(opts: {
  villageId: string;
  businessId: BusinessId;
  radiusKm: number;
  capital: number;
}): FeasibilityReport | null {
  // No silent substitution. A real LGD village has no demo fixture behind it,
  // and returning MOCK_VILLAGES[0] here would hand someone another village's
  // market figures under their own village's name.
  const village = MOCK_VILLAGES.find((v) => v.id === opts.villageId);
  if (!village) return null;
  const business = MOCK_BUSINESSES[opts.businessId];

  const inRadius = MOCK_VILLAGES.filter(
    (v) => v.id === village.id || distanceKm(village, v) <= opts.radiusKm,
  );

  const competitors: CompetitorRow[] = inRadius
    .map((v) => ({
      name: v.name,
      km: Math.round(distanceKm(village, v) * 10) / 10,
      count: competitorsIn(v, business),
      isYours: v.id === village.id,
    }))
    .sort((a, b) => b.count - a.count);

  const population = inRadius.reduce((n, v) => n + v.population, 0);
  const households = inRadius.reduce((n, v) => n + v.households, 0);
  const totalCompetitors = competitors.reduce((n, c) => n + c.count, 0);
  const peoplePerCompetitor = Math.round(population / (totalCompetitors + 1));

  const crowding = totalCompetitors / Math.max(1, population / 10000);
  const adjust = crowding > business.densityPer10k ? 0.92 : 1.06;
  const suggested = business.basePrice * adjust;
  const round = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n / 5) * 5);

  const viableCatchment = 10000 / business.densityPer10k;
  const headroom = Math.min(1, peoplePerCompetitor / viableCatchment);
  // Diminishing returns, not a hard cap. `min(1, capital / 20000)` was flat
  // above the threshold, so Rs 20,000 and Rs 5,00,000 scored identically and a
  // bigger cushion counted for nothing - the plateau, not the threshold, was
  // the exploitable part (Rs 19,999 and Rs 20,001 always scored the same).
  //
  // This term rises for every rupee and never reaches 1: Rs 5,000 scores 0.5,
  // Rs 20,000 scores 0.8, Rs 1,00,000 scores 0.95. No two capital values put
  // side by side score the same, and there is no value to stand either side of.
  const CAPITAL_HALF_FIT = 5000;
  const capitalFit = opts.capital / (opts.capital + CAPITAL_HALF_FIT);
  const score = Math.round((headroom * 0.6 + capitalFit * 0.4) * 100);

  // Two independent ceilings, and the estimate is the lower one.
  //
  // Demand: the people this unit would have to itself, the share of them who
  // buy this at all, what each of them buys in a year, at the price the report
  // is already suggesting.
  //
  // Capacity: what the applicant's own money can push through. Only the
  // working-capital lines of the project cost cycle; fixed assets are bought
  // once and do not turn.
  const price = round(suggested);
  // Grocery only, and only on the user's own village - see the note on
  // MOCK_GROCERY_SPEND_INDEX. Everything else runs at 1.
  const spend = business.id === 'grocery' ? (MOCK_GROCERY_SPEND_INDEX[village.id] ?? 1) : 1;
  const demandCeiling =
    peoplePerCompetitor * business.penetrationRate * spend * business.purchaseFrequencyPerYear * price;

  const projectCost = projectCostFrom(opts.capital);
  const workingShare = business.costSplit.reduce((n, c) => n + (c.working ? c.share : 0), 0);
  const capacityCeiling = projectCost * workingShare * business.workingCapitalTurns;

  return {
    village,
    business,
    radiusKm: opts.radiusKm,
    marketReach: { villages: inRadius.length, households, population },
    competitors,
    totalCompetitors,
    peoplePerCompetitor,
    pricing: { suggested: price, low: round(suggested * 0.85), high: round(suggested * 1.2) },
    score,
    verdict: score >= 60 ? 'good' : 'check',
    limiter:
      score >= 60
        ? ('none' as const)
        : totalCompetitors === 0
          ? ('thin-market' as const)
          : ('crowded' as const),
    projectCost,
    estimatedAnnualRevenue: Math.round(Math.min(demandCeiling, capacityCeiling)),
    revenueLimitedBy: demandCeiling <= capacityCeiling ? ('market' as const) : ('capital' as const),
    swot: {
      strengths: business.strengths,
      weaknesses: business.weaknesses,
      opportunities: business.opportunities,
      threats: business.threats,
    },
  };
}

/**
 * A better-scoring business for the same village, radius and capital.
 *
 * `reason` is deliberately one of two values rather than free text. At a fixed
 * village/radius/capital the capital term of the score is identical for every
 * business, so the ONLY thing separating them is headroom - and headroom has
 * exactly two inputs: how many units are already running, and how many people
 * one unit of that trade needs to be viable. Those are the two reasons, and
 * they are the true ones; anything more would be invented narration.
 */
export type Alternative = {
  business: MockBusiness;
  score: number;
  reason: 'less-competition' | 'smaller-catchment';
};

/**
 * Other businesses that would score better here. Empty unless the current pick
 * actually came back as `check` - a good verdict does not need talking out of -
 * and empty when nothing genuinely scores higher, rather than padding the list
 * with something worse so the section has content.
 *
 * Pure, and cheap: `buildReport` reads in-memory fixtures and touches no
 * network, so this is four more passes of the same arithmetic and needs no
 * extra request.
 */
export function betterAlternatives(opts: {
  villageId: string;
  businessId: BusinessId;
  radiusKm: number;
  capital: number;
}): Alternative[] {
  const current = buildReport(opts);
  if (!current || current.verdict !== 'check') return [];

  return (Object.keys(MOCK_BUSINESSES) as BusinessId[])
    .filter((id) => id !== opts.businessId)
    .map((id) => buildReport({ ...opts, businessId: id }))
    .filter((r): r is FeasibilityReport => r != null && r.score > current.score)
    .sort((a, b) => b.score - a.score)
    .map((r) => ({
      business: r.business,
      score: r.score,
      reason:
        r.totalCompetitors < current.totalCompetitors
          ? ('less-competition' as const)
          : ('smaller-catchment' as const),
    }));
}

/** One line of the project-cost breakdown. `label` stays bilingual so each
 *  layout localises it with its own `label()` call. */
export type CostLine = { label: Bilingual; amount: number; share: number };

/**
 * How a project cost divides over a business's own cost lines.
 *
 * Both capital screens render this and both used to do the multiplication
 * themselves. That is the same shape of bug as the duplicated project-cost
 * formula: two copies of one calculation that nothing forces to agree. The
 * amounts here come from `planLoan`'s `projectCost`, which comes from
 * `projectCostFrom`, so the whole chain is one definition end to end.
 */
export function costBreakdown(projectCost: number, business: MockBusiness): CostLine[] {
  return business.costSplit.map((c) => ({
    label: c.label,
    amount: Math.round(projectCost * c.share),
    share: c.share,
  }));
}

export function narrate(r: FeasibilityReport, lang: Lang): string {
  const v = pick(r.village.name, lang);
  const b = pick(r.business.name, lang).toLowerCase();
  const people = r.marketReach.population.toLocaleString('en-IN');
  const per = r.peoplePerCompetitor.toLocaleString('en-IN');
  const en = lang === 'en';

  if (r.verdict === 'good') {
    return en
      ? `Around ${v}, about ${people} people live within ${r.radiusKm} km and ${r.totalCompetitors} ${b} units serve them — roughly one for every ${per} people. That is room to start.`
      : `${v} के ${r.radiusKm} किमी में लगभग ${people} लोग हैं और ${b} के ${r.totalCompetitors} काम चल रहे हैं — यानी हर ${per} लोगों पर एक। शुरू करने की जगह है।`;
  }
  if (r.limiter === 'thin-market') {
    return en
      ? `Around ${v}, no ${b} unit is running within ${r.radiusKm} km — but only about ${people} people live in that circle. Nobody is competing, yet there may not be enough buyers either. Worth widening the radius or checking demand first.`
      : `${v} के ${r.radiusKm} किमी में ${b} का कोई काम नहीं चल रहा — पर इस दायरे में सिर्फ़ लगभग ${people} लोग हैं। मुक़ाबला नहीं है, लेकिन ख़रीदार भी कम हो सकते हैं। दायरा बढ़ाकर देखिए या पहले माँग जाँच लीजिए।`;
  }
  return en
    ? `Around ${v}, about ${people} people live within ${r.radiusKm} km, but ${r.totalCompetitors} ${b} units already serve them — only about ${per} people each. Worth checking demand before borrowing.`
    : `${v} के ${r.radiusKm} किमी में लगभग ${people} लोग हैं, पर ${b} के ${r.totalCompetitors} काम पहले से चल रहे हैं — हर एक के हिस्से सिर्फ़ ${per} लोग। कर्ज़ लेने से पहले माँग जाँच लीजिए।`;
}

export const label = pick;
