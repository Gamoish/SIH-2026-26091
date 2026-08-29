'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import type { Session } from '@/types';

export type Slug =
  | 'language'
  | 'phone'
  | 'otp'
  | 'social'
  | 'location'
  | 'capital'
  | 'category'
  | 'loading'
  | 'feasibility'
  | 'report'
  | 'swot'
  | 'competitors'
  | 'pricing'
  | 'scheme'
  | 'emi'
  | 'share'
  | 'home'
  | 'saved'
  | 'settings'
  | 'empty';

export const ONBOARDING: Slug[] = ['language', 'phone', 'otp', 'social', 'location', 'capital', 'category'];

const NEEDS: Partial<Record<Slug, { has: (s: Session) => boolean; go: Slug }>> = {
  social: { has: (s) => s.verified, go: 'language' },
  location: { has: (s) => s.social != null, go: 'social' },
  capital: { has: (s) => s.village != null, go: 'location' },
  category: { has: (s) => s.capital != null, go: 'capital' },
  loading: { has: (s) => s.business != null, go: 'category' },
  feasibility: { has: (s) => s.business != null, go: 'category' },
  report: { has: (s) => s.business != null, go: 'category' },
  swot: { has: (s) => s.business != null, go: 'category' },
  competitors: { has: (s) => s.business != null, go: 'category' },
  pricing: { has: (s) => s.business != null, go: 'category' },
  scheme: { has: (s) => s.capital != null && s.social != null, go: 'capital' },
  emi: { has: (s) => s.capital != null && s.social != null, go: 'capital' },
  share: { has: (s) => s.capital != null && s.business != null, go: 'category' },
  home: { has: (s) => s.verified, go: 'language' },
  saved: { has: (s) => s.verified, go: 'language' },
  settings: { has: (s) => s.verified, go: 'language' },
};

const BEHIND: Partial<Record<Slug, (s: Session) => boolean>> = {
  phone: (s) => s.verified,
  location: (s) => s.savedAt != null,
  capital: (s) => s.savedAt != null,
  category: (s) => s.savedAt != null,
  loading: (s) => s.savedAt != null,
};

export function redirectFor(slug: string, s: Session): Slug | null {
  if (BEHIND[slug as Slug]?.(s)) return 'home';

  let at = slug as Slug;
  for (let hops = 0; hops < ONBOARDING.length + 1; hops++) {
    const need = NEEDS[at];
    if (!need || need.has(s)) return hops === 0 ? null : at;
    at = need.go;
  }
  return 'language';
}

export function useNav() {
  const router = useRouter();
  const go = useCallback((slug: Slug) => router.push(`/screens/${slug}`), [router]);
  const replace = useCallback((slug: Slug) => router.replace(`/screens/${slug}`), [router]);
  const back = useCallback(() => router.back(), [router]);
  return useMemo(() => ({ go, replace, back }), [go, replace, back]);
}

export function useStartCheck() {
  const { set } = useSession();
  const nav = useNav();
  return useCallback(() => {
    set({ savedAt: null });
    nav.go('location');
  }, [set, nav]);
}
