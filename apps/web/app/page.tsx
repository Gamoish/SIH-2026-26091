'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { isOnboarded } from '@/lib/nav';

export default function Entry() {
  const router = useRouter();
  const { s, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    // resume where they stopped: an account goes home, a half-finished
    // first run goes back to the step it died on, never to the top
    const at = isOnboarded(s) ? 'home' : s.verified ? 'social' : 'language';
    router.replace(`/screens/${at}`);
  }, [ready, s, router]);

  return null;
}
