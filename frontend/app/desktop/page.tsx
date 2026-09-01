'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { isOnboarded } from '@/lib/nav';

/**
 * `/desktop` itself is an entry point, not a screen - the same resume rule as
 * `app/page.tsx`: an account goes home, a half-finished first run goes back to
 * the step it died on, never to the top.
 */
export default function DesktopEntry() {
  const router = useRouter();
  const { s, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    const at = isOnboarded(s) ? 'home' : s.verified ? 'social' : 'language';
    router.replace(`/desktop/${at}`);
  }, [ready, s, router]);

  return null;
}
