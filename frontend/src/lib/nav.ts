'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
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
  | 'edit-photo'
  | 'edit-category'
  | 'empty';

// Business before capital: the capital step's live estimate is only meaningful
// once we know what is being costed, and the cost-split it renders is per
// business. `previousStep` derives from this array, so the back links follow.
export const ONBOARDING: Slug[] = ['language', 'phone', 'otp', 'social', 'location', 'category', 'capital'];

/**
 * The first-run identity screens. These establish *who the account is* and are
 * seen exactly once. `location`/`capital`/`category` are deliberately NOT here:
 * they are per-check inputs, and "Start a new check" walks a logged-in user
 * back through them on purpose.
 */
export const FIRST_RUN_ONLY: Slug[] = ['language', 'phone', 'otp', 'social'];

/**
 * An account exists once the phone is verified AND the identity step is done.
 * `verified` alone is not enough: it is true in the gap between the OTP screen
 * and the social screen, while the user is still mid-onboarding.
 */
export const isOnboarded = (s: Session) => s.verified && s.social != null;

const NEEDS: Partial<Record<Slug, { has: (s: Session) => boolean; go: Slug }>> = {
  social: { has: (s) => s.verified, go: 'language' },
  location: { has: (s) => s.social != null, go: 'social' },
  // A village is chosen when *either* identifier is set: a demo fixture has an
  // id and no LGD code, a real directory row has an LGD code and no fixture.
  // Testing only `village` silently bounced every real selection back here.
  category: { has: (s) => s.village != null || s.villageLgdCode != null, go: 'location' },
  capital: { has: (s) => s.business != null, go: 'category' },
  // Capital is now the LAST question, so these check capital rather than
  // business: business alone no longer implies the rest of the chain is done.
  // Each only names the step immediately before it and lets the loop below
  // walk the remainder - capital -> category -> location - so the order lives
  // in one place instead of being restated per screen.
  loading: { has: (s) => s.capital != null, go: 'capital' },
  feasibility: { has: (s) => s.capital != null, go: 'capital' },
  report: { has: (s) => s.capital != null, go: 'capital' },
  swot: { has: (s) => s.capital != null, go: 'capital' },
  competitors: { has: (s) => s.capital != null, go: 'capital' },
  pricing: { has: (s) => s.capital != null, go: 'capital' },
  scheme: { has: (s) => s.capital != null && s.social != null, go: 'capital' },
  emi: { has: (s) => s.capital != null && s.social != null, go: 'capital' },
  share: { has: (s) => s.capital != null && s.business != null, go: 'capital' },
  home: { has: isOnboarded, go: 'language' },
  saved: { has: isOnboarded, go: 'language' },
  settings: { has: isOnboarded, go: 'language' },
  'edit-photo': { has: isOnboarded, go: 'language' },
  'edit-category': { has: isOnboarded, go: 'language' },
};

const BEHIND: Partial<Record<Slug, (s: Session) => boolean>> = {
  location: (s) => s.savedAt != null,
  capital: (s) => s.savedAt != null,
  category: (s) => s.savedAt != null,
  loading: (s) => s.savedAt != null,
};

/**
 * A logged-in user can never *arrive* at a first-run screen - not by deep link,
 * not by browser back, not from a Settings row. Editing a profile field goes
 * through the dedicated edit screens instead.
 *
 * This is deliberately an entry check, applied by `ScreensLayout` when the route
 * changes, and not part of `redirectFor`. The last first-run step is the one
 * that makes `isOnboarded` true, so a guard that also fired on state changes
 * would throw the user off the identity screen at the instant they completed it,
 * cancelling their own move to the next step.
 */
export function firstRunBlock(slug: string, s: Session): Slug | null {
  return isOnboarded(s) && FIRST_RUN_ONLY.includes(slug as Slug) ? 'home' : null;
}

/**
 * The step before this one, or null when there is none to offer.
 *
 * Derived from ONBOARDING rather than written out again, so the order has one
 * definition. Two cases return null on purpose:
 *
 *   - `language`, the first step, has nothing behind it.
 *   - a previous step that `firstRunBlock` would bounce. Once the identity
 *     screens are done `isOnboarded` is true, so walking back from `location`
 *     to `social` would land on `home` instead - a back button that silently
 *     throws you somewhere else is worse than no back button. Name and category
 *     are editable from Settings, which is where that change belongs.
 *
 * A slug outside ONBOARDING (`loading`, the report screens) has no previous
 * step here: those are not questions the user answers.
 */
export function previousStep(slug: string, s: Session): Slug | null {
  const i = ONBOARDING.indexOf(slug as Slug);
  if (i <= 0) return null;
  const prev = ONBOARDING[i - 1];
  return firstRunBlock(prev, s) ? null : prev;
}

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

/**
 * The two layouts live under different roots but walk the same slugs, so the
 * guards (`redirectFor`, `firstRunBlock`) and this hook are shared and the
 * base path is the only thing that varies. Duplicating the flow per layout is
 * what would let phone and desktop drift apart.
 */
export type Base = '/screens' | '/desktop';

const BaseCtx = createContext<Base>('/screens');

/** Wraps a layout subtree so every `nav.go` inside it stays in that layout. */
export const NavBase = BaseCtx.Provider;

export function useNav() {
  const router = useRouter();
  const base = useContext(BaseCtx);
  const go = useCallback((slug: Slug) => router.push(`${base}/${slug}`), [router, base]);
  const replace = useCallback((slug: Slug) => router.replace(`${base}/${slug}`), [router, base]);
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
