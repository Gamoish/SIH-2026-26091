'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { redirectFor } from '@/lib/nav';
import { monumentVar } from '@/lib/monuments';

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { s, ready } = useSession();
  const slug = pathname.split('/')[2] ?? '';
  const to = ready ? redirectFor(slug, s) : null;

  useEffect(() => {
    if (to) router.replace(`/screens/${to}`);
  }, [to, router]);

  if (!ready || to) return null;

  const monument = monumentVar(slug);

  return (
    <div
      data-screen={slug}
      style={
        {
          display: 'contents',
          ...(monument ? { '--monument': monument } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
