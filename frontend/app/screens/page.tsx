'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { isOnboarded } from '@/lib/nav';

/**
 * `/screens` itself is an entry point, not a screen - the mirror of
 * `app/desktop/page.tsx`, and the same resume rule as `app/page.tsx`: an
 * account goes home, a half-finished first run goes back to the step it died
 * on, never to the top.
 *
 * This exists because `targetFor` returns the bare base when the path it is
 * translating has no slug (`layout.ts`), so a phone-cookied visitor who lands
 * on `/desktop` is redirected here by middleware. Without this file that
 * redirect ended on a 404 - the desktop tree had an entry page and the phone
 * tree did not.
 */
export default function ScreensEntry() {
  const router = useRouter();
  const { s, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    const at = isOnboarded(s) ? 'home' : s.verified ? 'social' : 'language';
    router.replace(`/screens/${at}`);
  }, [ready, s, router]);

  return null;
}
