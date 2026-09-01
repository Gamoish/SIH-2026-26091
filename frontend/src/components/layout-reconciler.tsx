'use client';

import { useEffect, useState } from 'react';
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
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const here = layoutOf(pathname);

    // Already chosen, or not one of the two trees: nothing to resolve.
    if (here === null || storedLayout() !== null) {
      setSettled(true);
      return;
    }

    const actual: Layout = window.matchMedia(DESKTOP_QUERY).matches ? 'desktop' : 'phone';
    const to = targetFor(pathname, actual);

    // Record either way: the next request then skips user-agent sniffing, and
    // a later resize keeps the visitor on the layout they were last using.
    rememberLayout(to ? actual : here);

    if (!to) {
      setSettled(true);
      return;
    }
    router.replace(to);
  }, [pathname, router]);

  if (!settled) return null;
  return <>{children}</>;
}
