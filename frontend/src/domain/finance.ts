import type { SocialCategory } from '../types/index.ts';
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
 * Total project cost from what the applicant puts in. The term-loan schemes
 * define it the other way round - the beneficiary contributes `beneficiaryPct`
 * of the project - so the cost is the contribution grossed back up.
 *
 * `feasibility.ts` and `planLoan` both need this figure and used to compute it
 * separately, which meant the report and the loan page could quietly disagree.
 * The default is the 10% NSFDC/NSTFDC contribution, for the feasibility side,
 * which has no social category to look a scheme up with.
 */
/**
 * The smallest own-capital figure worth running the money engine on.
 *
 * PROPOSED, not sourced: neither corporation publishes a floor. With a 10%
 * beneficiary contribution every rupee of capital becomes ten of project cost,
 * so ₹2,000 is a ₹20,000 project - about where the cheapest of the five
 * categories stops being a business. Under it (₹1,000 -> a ₹10,000 project,
 * ₹4,600 of sewing machine) nothing in the fixed-asset line buys working
 * equipment, and the output is arithmetic rather than advice.
 *
 * Inclusive: exactly ₹2,000 still plans.
 */
export const MIN_CAPITAL = 2000;

export function projectCostFrom(capital: number, beneficiaryPct = 10): number {
  return Math.round(capital / (beneficiaryPct / 100));
}

export function emiFor(principal: number, annualPct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

export function planLoan(capital: number, social: SocialCategory): PlanResult {
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

  const grossCost = projectCostFrom(capital, beneficiaryPct);
  const grossLoan = grossCost - capital;

  // NSFDC picks its product by project cost, NSTFDC prices by the loan. Both
  // quantities are known before a tier is chosen - the contribution percent is
  // the same across every tier of a scheme - so there is no circularity here.
  const tier = selectTier(scheme, scheme.tierBasis === 'project-cost' ? grossCost : grossLoan);
  if (!tier) return { unavailable: true, scheme, missing: [], reason: 'above-ceiling' };

  const { interestPct, tenureMonths, moratoriumMonths } = tier;

  // A tier's own loan ceiling can bite before its band does - NSFDC's Micro
  // Finance Scheme runs to a ₹1,40,000 project but caps the loan at
  // ₹1,25,000, and 90% of ₹1,40,000 is ₹1,26,000. When it binds, the project
  // is what the money actually buys: the borrower's capital plus the most the
  // scheme will lend. Clamping only ever lowers the cost, so it cannot push
  // the project into a different tier.
  const loanAmount = tier.maxLoan != null ? Math.min(grossLoan, tier.maxLoan) : grossLoan;
  const projectCost = capital + loanAmount;

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
