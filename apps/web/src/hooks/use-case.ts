'use client';

import { useMemo } from 'react';
import { useSession } from './use-session';
import { buildReport, type FeasibilityReport } from '../domain/feasibility';
import { planLoan, type PlanResult } from '../domain/finance';

export function useCase(): {
  report: FeasibilityReport | null;
  plan: PlanResult | null;
  ready: boolean;
} {
  const { s, ready } = useSession();

  const report = useMemo(
    () =>
      s.village && s.business && s.capital != null
        ? buildReport({ villageId: s.village, businessId: s.business, radiusKm: s.radiusKm, capital: s.capital })
        : null,
    [s.village, s.business, s.capital, s.radiusKm],
  );

  const plan = useMemo(
    () => (s.capital != null && s.social ? planLoan(s.capital, s.social) : null),
    [s.capital, s.social],
  );

  return { report, plan, ready };
}
