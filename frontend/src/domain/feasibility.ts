import type { Bilingual, BusinessId, Lang } from '../types/index.ts';
import { MOCK_VILLAGES, distanceKm, type MockVillage } from '../data/fixtures/villages.ts';
import { MOCK_BUSINESSES, type MockBusiness } from '../data/fixtures/businesses.ts';

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
  swot: { strengths: Bilingual[]; weaknesses: Bilingual[]; opportunities: Bilingual[]; threats: Bilingual[] };
};

function competitorsIn(v: MockVillage, b: MockBusiness): number {
  const base = (v.population / 10000) * b.densityPer10k;
  return Math.max(v.town ? 1 : 0, Math.round(base * (v.town ? 1.6 : 1)));
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
  const capitalFit = Math.min(1, opts.capital / 20000);
  const score = Math.round((headroom * 0.6 + capitalFit * 0.4) * 100);

  const projectCost = opts.capital * 10;
  return {
    village,
    business,
    radiusKm: opts.radiusKm,
    marketReach: { villages: inRadius.length, households, population },
    competitors,
    totalCompetitors,
    peoplePerCompetitor,
    pricing: { suggested: round(suggested), low: round(suggested * 0.85), high: round(suggested * 1.2) },
    score,
    verdict: score >= 60 ? 'good' : 'check',
    limiter:
      score >= 60
        ? ('none' as const)
        : totalCompetitors === 0
          ? ('thin-market' as const)
          : ('crowded' as const),
    estimatedAnnualRevenue: Math.round(projectCost * business.annualRevenueRatio),
    swot: {
      strengths: business.strengths,
      weaknesses: business.weaknesses,
      opportunities: business.opportunities,
      threats: business.threats,
    },
  };
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
