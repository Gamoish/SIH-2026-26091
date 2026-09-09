import type { Session } from '../types/index.ts';
import { buildReport, betterAlternatives, type Alternative, type FeasibilityReport } from './feasibility.ts';
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

  const plan = s.capital != null && s.social ? planLoan(s.capital, s.social) : null;

  const alternatives =
    s.village && s.business && s.capital != null
      ? betterAlternatives({
          villageId: s.village,
          businessId: s.business,
          radiusKm: s.radiusKm,
          capital: s.capital,
        })
      : [];

  return { report, plan, alternatives };
}

/** EMI as a share of the estimated monthly income - the affordability check. */
export function emiShare(c: Case): number | null {
  if (!c.report || !c.plan || isGap(c.plan)) return null;
  const monthly = c.report.estimatedAnnualRevenue / 12;
  return monthly > 0 ? Math.round((c.plan.emi / monthly) * 100) : null;
}
