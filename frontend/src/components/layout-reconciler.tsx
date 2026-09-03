'use client';

import { useEffect, useMemo } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import { usePathname, useRouter } from 'next/navigation';
import { DESKTOP_QUERY, layoutOf, rememberLayout, storedLayout, targetFor, type Layout } from '@/lib/layout';

/**
 * Resolves the server's user-agent *guess* against the real viewport, once.
 *
 * It only acts when nothing has been settled yet. A cookie - whether written
 * by an earlier correction or by an explicit choice like Settings' "Open on
 * phone" - is the answer, and re-deciding would silently undo that choice the
 * moment a desktop-sized window asked for the phone layout.
 *
 * There is deliberately no `resize` listener. Mid-resize a visitor may be
 * part-way through typing a phone number, an OTP or a capital amount; that is
 * component state, and a route change would discard it and then bounce them a
 * step back because the session was never written. Switching layouts is a
 * fresh-navigation decision, not a live one.
 *
 * `children` are withheld until the check has run, so a mismatch shows one
 * blank frame rather than the wrong layout - the flash this exists to prevent.
 */
export function LayoutReconciler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();

  /**
   * One decision, read by both the render and the effect below.
   *
   * `hydrated` is false on the server and through hydration, so localStorage and
   * matchMedia are only ever touched on the client - and the first client render
   * still matches the server's markup. Deriving this instead of assigning it from
   * an effect is what keeps the resolution to a single render pass.
   *
   * `null` means "not decided yet"; a non-null `actual` means this visitor's
   * viewport answered and that answer still needs recording.
   */
  const decision = useMemo(() => {
    if (!hydrated) return null;
    const here = layoutOf(pathname);

    // Already chosen, or not one of the two trees: nothing to resolve.
    if (here === null || storedLayout() !== null) return { actual: null, to: null };

    const actual: Layout = window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'phone';
    return { actual, to: targetFor(pathname, actual) };
  }, [hydrated, pathname]);

  useEffect(() => {
    // Record the viewport's answer, not the tree they happen to be standing in.
    // `targetFor` returns null for two different reasons - already in the right
    // tree, or on a slug the other tree does not have - and recording `here`
    // conflated them: a desktop visitor whose first URL was /screens/edit-photo
    // was filed as a phone user for a year.
    if (!decision?.actual) return;
    rememberLayout(decision.actual);
    if (decision.to) router.replace(decision.to);
  }, [decision, router]);

  // Undecided, or about to navigate away: show nothing rather than the wrong tree.
  if (!decision || decision.to) return null;
  return <>{children}</>;
}
