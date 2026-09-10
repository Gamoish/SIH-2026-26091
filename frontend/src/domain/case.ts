import type { Session } from '../types/index.ts';
import {
  buildReport,
  betterAlternatives,
  capitalFitFor,
  type Alternative,
  type CapitalFit,
  type FeasibilityReport,
} from './feasibility.ts';
import { planLoan, isGap, type PlanResult } from './finance.ts';

export type Case = {
  /** Null until location, business and capital are all answered. */
  report: FeasibilityReport | null;
  /**
   * Null until capital and social category are answered. A `PlanGap` is a
   * real value, not an absence - it is how an unconfirmed scheme figure
   * reaches the screen instead of an invented number - so it is passed
   * through rather than collapsed, and callers narrow it with `isGap`.
   */
  plan: PlanResult | null;
  /**
   * Better-scoring businesses for the same village, radius and capital. Empty
   * whenever the report is good, absent, or genuinely has nothing better to
   * offer. Computed here rather than in each screen so the phone flow and the
   * wide view can never recommend different things for the same session.
   */
  alternatives: Alternative[];
  /**
   * Non-null when the plan is thin for the chosen business. Advisory: the loan
   * plan beside it is unaffected and still shows its own figures.
   */
  capitalFit: CapitalFit | null;
};

/**
 * The one place a session turns into a case. Both layouts - the phone flow at
 * `/screens/*` and the wide view at `/case/*` - call this, so the two can
 * never show different numbers for the same person. Pure and session-shaped,
 * so it is testable in node without React.
 *
 * The two halves are computed independently, exactly as the screens consume
 * them: a session can have enough for a feasibility report and not yet enough
 * for a loan plan.
 */
export function caseFrom(s: Session): Case {
  const report =
    s.village && s.business && s.capital != null
      ? buildReport({
          villageId: s.village,
          businessId: s.business,
          radiusKm: s.radiusKm,
          capital: s.capital,
        })
      : null;

  const plan = s.capital != null && s.social && s.business ? planLoan(s.capital, s.social, s.business) : null;

  const alternatives =
    s.village && s.business && s.capital != null
      ? betterAlternatives({
          villageId: s.village,
          businessId: s.business,
          radiusKm: s.radiusKm,
          capital: s.capital,
        })
      : [];

  // The scheme's own contribution percent where there is one, and the 10%
  // both sourced corporations use as the fallback, so an unsourced scheme
  // still gets the note rather than losing it.
  const capitalFit =
    report && s.village && s.business && s.capital != null
      ? capitalFitFor(
          {
            villageId: s.village,
            businessId: s.business,
            radiusKm: s.radiusKm,
            capital: s.capital,
          },
          plan && !isGap(plan) ? plan.beneficiaryPct : undefined,
        )
      : null;

  return { report, plan, alternatives, capitalFit };
}

/**
 * The reading the score's own inputs add up to, for the verdict screen to put
 * into a sentence.
 *
 * The score is `headroom * 0.6 + capitalFit * 0.4`. Both halves are already
 * shown as bare figures elsewhere on that screen; what was missing was what
 * they MEAN together, and a fixed sentence saying "moderately competitive"
 * under every result would have said it whether or not it was true. Everything
 * here is computed from this case.
 *
 * `headroom` is recomputed rather than read off the report, because
 * `buildReport` keeps it as a local. It is the same two lines - the catchment
 * one unit of this trade needs, against the people one unit here would
 * actually get - and `insight-headroom-tracks-the-score` in tests/case.test.mjs
 * pins the two together so the copy cannot quietly disagree with the number it
 * is explaining.
 *
 * ponytail: duplicated formula, because domain/feasibility.ts is off limits in
 * this pass. Fold it into FeasibilityReport and delete the arithmetic here the
 * next time that file is open.
 */
export type Insight = {
  /** 0-1: the share of one viable unit's catchment this unit would have. */
  headroom: number;
  /** People each existing unit here already serves. */
  perCompetitor: number;
  /** People one unit of this trade needs to be viable. */
  viableCatchment: number;
  /** Which of the three readings `headroom` falls into. */
  reading: 'room' | 'tight' | 'crowded';
  /** Non-null when the applicant's own capital is short of the scheme margin. */
  margin: CapitalFit | null;
  /** Whether demand or the size of the setup is what caps the revenue estimate. */
  limitedBy: 'market' | 'capacity';
};

export function insight(c: Case): Insight | null {
  if (!c.report) return null;
  const r = c.report;

  // Unrounded for the arithmetic, rounded only for the sentence: rounding the
  // catchment first moved the reconstructed score by a point.
  const catchment = 10000 / r.business.densityPer10k;
  const headroom = Math.min(1, r.peoplePerCompetitor / catchment);

  return {
    headroom,
    perCompetitor: r.peoplePerCompetitor,
    viableCatchment: Math.round(catchment),
    // Cut where the advice actually changes. Below 0.45 a new unit would get
    // under half the catchment its trade needs and the honest word is crowded;
    // above 0.7 headroom has stopped being the thing holding the score down.
    // The bounds are set against the range the engine really produces
    // (roughly 0.13 to 0.73 over the fixtures) rather than against a tidy
    // 0/1 split that would have left one of the three readings unreachable.
    reading: headroom >= 0.7 ? 'room' : headroom >= 0.45 ? 'tight' : 'crowded',
    margin: c.capitalFit,
    limitedBy: r.revenueLimitedBy,
  };
}

/** EMI as a share of the estimated monthly income - the affordability check. */
export function emiShare(c: Case): number | null {
  if (!c.report || !c.plan || isGap(c.plan)) return null;
  const monthly = c.report.estimatedAnnualRevenue / 12;
  return monthly > 0 ? Math.round((c.plan.emi / monthly) * 100) : null;
}
