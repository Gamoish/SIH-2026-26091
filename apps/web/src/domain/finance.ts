import type { SocialCategory } from '../types/index.ts';
import { schemeFor, type SchemeRow } from './schemes.ts';

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
};

export type PlanResult = LoanPlan | PlanGap;

export const isGap = (r: PlanResult): r is PlanGap => 'unavailable' in r;

export function emiFor(principal: number, annualPct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

export function planLoan(capital: number, social: SocialCategory): PlanResult {
  const scheme = schemeFor(social);
  if (!scheme) return { unavailable: true, scheme: null, missing: ['scheme'] };

  const missing = (['interestPct', 'tenureMonths', 'moratoriumMonths', 'beneficiaryPct'] as const)
    .filter((k) => scheme[k] == null);
  if (missing.length) return { unavailable: true, scheme, missing };

  const interestPct = scheme.interestPct!;
  const tenureMonths = scheme.tenureMonths!;
  const moratoriumMonths = scheme.moratoriumMonths!;
  const beneficiaryPct = scheme.beneficiaryPct!;

  const projectCost = Math.round(capital / (beneficiaryPct / 100));
  const loanAmount = projectCost - capital;

  const monthlyRate = interestPct / 100 / 12;
  const moratoriumInterest = Math.round(loanAmount * monthlyRate * moratoriumMonths);
  const amortised = loanAmount + moratoriumInterest;
  const instalmentCount = tenureMonths - moratoriumMonths;
  const emi = Math.round(emiFor(amortised, interestPct, instalmentCount));

  const years: YearRow[] = [];
  let balance = amortised;
  let totalRepaid = 0;
  for (let m = 1, y = { year: 1, paid: 0, interest: 0, instalments: 0, hasGrace: false }; m <= tenureMonths; m++) {
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
