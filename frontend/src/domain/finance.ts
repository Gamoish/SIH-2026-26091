import type { BusinessId, SocialCategory } from '../types/index.ts';
import { MOCK_BUSINESSES } from '../data/fixtures/businesses.ts';
import { schemeFor, selectTier, type SchemeRow, type SchemeTier } from './schemes.ts';

export type YearRow = {
  year: number;
  paid: number;
  interest: number;
  balance: number;
  instalments: number;
  hasGrace: boolean;
};

export type LoanPlan = {
  scheme: SchemeRow;
  /** The rate band this project actually fell into. */
  tier: SchemeTier;
  capital: number;
  projectCost: number;
  loanAmount: number;
  beneficiaryPct: number;
  /** What the scheme expects the applicant to put in: `beneficiaryPct` of the
   *  project cost. Capital below this is a financing shortfall. */
  requiredMargin: number;
  interestPct: number;
  tenureMonths: number;
  moratoriumMonths: number;
  instalmentCount: number;
  emi: number;
  moratoriumInterest: number;
  amortised: number;
  totalRepaid: number;
  totalInterest: number;
  years: YearRow[];
};

export type PlanGap = {
  unavailable: true;
  scheme: SchemeRow | null;
  missing: string[];
  /**
   * Why there is no plan. The screens phrase these very differently: an
   * unsourced scheme is our gap and we say so, whereas a capital below the
   * floor is something the user can fix by typing a bigger number.
   */
  reason: 'unsourced' | 'below-minimum' | 'above-ceiling';
};

export type PlanResult = LoanPlan | PlanGap;

export const isGap = (r: PlanResult): r is PlanGap => 'unavailable' in r;

/**
 * The smallest own-capital figure worth running the money engine on.
 *
 * PROPOSED, not sourced: neither corporation publishes a floor. It is a floor
 * on the applicant, not on the project - under ₹2,000 of own money there is no
 * margin to speak of and the output is arithmetic rather than advice. It is
 * deliberately well below every scheme's required margin: falling short of the
 * margin is a soft warning the user can act on, not a refusal to calculate.
 *
 * Inclusive: exactly ₹2,000 still plans.
 */
export const MIN_CAPITAL = 2000;

/**
 * What the business actually costs to set up.
 *
 * It used to be the applicant's capital grossed up by the contribution percent,
 * which made the project cost a function of the one number that has nothing to
 * do with equipment prices: ₹22,000 became a ₹2,20,000 project whether that
 * bought a plate press or a sewing machine. It is now the business's own
 * anchor cost - the same hand-costed figure the capital-fit note judges
 * against - so the cost of a leaf-plate unit is the cost of a leaf-plate unit
 * whoever is standing in front of it.
 *
 * `feasibility.ts` and `planLoan` both read this one function, so the report
 * and the loan page cannot drift apart.
 */
export function projectCostFor(businessId: BusinessId): number {
  return MOCK_BUSINESSES[businessId].anchorCost;
}

export function emiFor(principal: number, annualPct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

export function planLoan(capital: number, social: SocialCategory, businessId: BusinessId): PlanResult {
  const scheme = schemeFor(social);
  if (!scheme) return { unavailable: true, scheme: null, missing: ['scheme'], reason: 'unsourced' };

  // An empty tier list is how an unsourced scheme is recorded - see NBCFDC.
  const missing = [
    ...(scheme.beneficiaryPct == null ? ['beneficiaryPct'] : []),
    ...(scheme.tiers.length === 0 ? ['interestPct', 'tenureMonths', 'moratoriumMonths'] : []),
  ];
  if (missing.length) return { unavailable: true, scheme, missing, reason: 'unsourced' };

  const beneficiaryPct = scheme.beneficiaryPct!;

  // Below the floor the arithmetic still works and the answer is meaningless,
  // so it is refused rather than printed.
  if (capital < MIN_CAPITAL) {
    return { unavailable: true, scheme, missing: [], reason: 'below-minimum' };
  }

  // The project costs what it costs. The applicant's capital is the margin
  // they bring to it, not the thing that sizes it.
  const grossCost = projectCostFor(businessId);
  const requiredMargin = Math.round(grossCost * (beneficiaryPct / 100));
  // Over-contributing is allowed and simply borrows less; it never turns into
  // a negative loan.
  const grossLoan = Math.max(0, grossCost - capital);

  // NSFDC picks its product by project cost, NSTFDC prices by the loan. Both
  // quantities are known before a tier is chosen - the contribution percent is
  // the same across every tier of a scheme - so there is no circularity here.
  const tier = selectTier(scheme, scheme.tierBasis === 'project-cost' ? grossCost : grossLoan);
  if (!tier) return { unavailable: true, scheme, missing: [], reason: 'above-ceiling' };

  const { interestPct, tenureMonths, moratoriumMonths } = tier;

  // A tier's own loan ceiling still applies - NSFDC's Micro Finance Scheme
  // runs to a ₹1,40,000 project but lends at most ₹1,25,000. No anchor cost
  // currently reaches it (the only business inside that band is tailoring, at
  // ₹90,000), so the clamp does not bite today; it stays because the ceiling
  // is real and the anchors are data. When it does bind, the project cost is
  // unchanged - the shortfall is the borrower's to find, and `requiredMargin`
  // is what says so.
  const loanAmount = tier.maxLoan != null ? Math.min(grossLoan, tier.maxLoan) : grossLoan;
  const projectCost = grossCost;

  const monthlyRate = interestPct / 100 / 12;
  const moratoriumInterest = Math.round(loanAmount * monthlyRate * moratoriumMonths);
  const amortised = loanAmount + moratoriumInterest;
  const instalmentCount = tenureMonths - moratoriumMonths;
  const emi = Math.round(emiFor(amortised, interestPct, instalmentCount));

  const years: YearRow[] = [];
  let balance = amortised;
  let totalRepaid = 0;
  for (
    let m = 1, y = { year: 1, paid: 0, interest: 0, instalments: 0, hasGrace: false };
    m <= tenureMonths;
    m++
  ) {
    if (m <= moratoriumMonths) {
      y.hasGrace = true;
    } else {
      const interest = balance * monthlyRate;
      const due = m === tenureMonths ? balance + interest : emi;
      balance = balance + interest - due;
      y.paid += due;
      y.interest += interest;
      y.instalments++;
      totalRepaid += due;
    }
    if (m % 12 === 0 || m === tenureMonths) {
      years.push({
        year: y.year,
        paid: Math.round(y.paid),
        interest: Math.round(y.interest),
        balance: Math.max(0, Math.round(balance)),
        instalments: y.instalments,
        hasGrace: y.hasGrace,
      });
      y = { year: y.year + 1, paid: 0, interest: 0, instalments: 0, hasGrace: false };
    }
  }

  return {
    scheme,
    tier,
    capital,
    projectCost,
    loanAmount,
    beneficiaryPct,
    requiredMargin,
    interestPct,
    tenureMonths,
    moratoriumMonths,
    instalmentCount,
    emi,
    moratoriumInterest,
    amortised,
    totalRepaid: Math.round(totalRepaid),
    totalInterest: Math.round(totalRepaid - loanAmount),
    years,
  };
}

export function compareAgainst(plan: LoanPlan, annualPct: number) {
  const emi = emiFor(plan.amortised, annualPct, plan.instalmentCount);
  const totalRepaid = Math.round(emi * plan.instalmentCount);
  return {
    annualPct,
    emi: Math.round(emi),
    totalRepaid,
    totalInterest: Math.round(totalRepaid - plan.loanAmount),
    saved: Math.round(totalRepaid - plan.totalRepaid),
  };
}
