'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

export default function Entry() {
  const router = useRouter();
  const { s, ready } = useSession();

  useEffect(() => {
    if (!ready) return;
    router.replace(s.verified ? '/screens/home' : '/screens/language');
  }, [ready, s.verified, router]);

  return null;
}
