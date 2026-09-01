'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { isOnboarded } from '@/lib/nav';
import { BASE, DESKTOP_QUERY, LAYOUT_COOKIE, isValidLayout, rememberLayout } from '@/lib/layout';

/**
 * `/` is an entry point, not a screen. It picks two things at once: which step
 * to resume at (from the session) and which layout to resume it in.
 *
 * The layout question is settled here rather than in middleware because only
 * this component knows the step - middleware would have to redirect to a base
 * it cannot pick a slug for. The cookie is read first for the same reason it
 * wins in middleware: a visitor who has corrected the guess keeps their choice.
 */
export default function Entry() {
  const router = useRouter();
  const { s, ready } = useSession();

  useEffect(() => {
    if (!ready) return;

    const stored = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${LAYOUT_COOKIE}=`))
      ?.split('=')[1];

    const layout = isValidLayout(stored)
      ? stored
      : window.matchMedia(DESKTOP_QUERY).matches
        ? 'desktop'
        : 'phone';
    rememberLayout(layout);

    // resume where they stopped: an account goes home, a half-finished
    // first run goes back to the step it died on, never to the top
    const at = isOnboarded(s) ? 'home' : s.verified ? 'social' : 'language';
    router.replace(`${BASE[layout]}/${at}`);
  }, [ready, s, router]);

  return null;
}
