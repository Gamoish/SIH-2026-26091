'use client';

import { useMemo } from 'react';
import { useSession } from './use-session';
import { caseFrom, type Case } from '../domain/case';

export function useCase(): Case & { ready: boolean } {
  const { s, ready } = useSession();
  const c = useMemo(
    () => caseFrom(s),
    // the case is a pure function of these five answers; recomputing on any
    // other session edit (a name change, a language toggle) is wasted work
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.village, s.business, s.capital, s.radiusKm, s.social],
  );

  return { ...c, ready };
}
