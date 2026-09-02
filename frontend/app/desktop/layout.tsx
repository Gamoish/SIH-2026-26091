'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { NavBase, firstRunBlock, redirectFor, type Slug } from '@/lib/nav';
import { monumentVar } from '@/lib/monuments';
import { LayoutReconciler } from '@/components/layout-reconciler';

/**
 * The desktop layout's entry guard.
 *
 * Deliberately the same shape as `app/screens/layout.tsx`, calling the same
 * `firstRunBlock` / `redirectFor` from `lib/nav.ts`: the two layouts walk one
 * flow, so a user cannot reach a step on desktop that the phone would have
 * sent them back from. `NavBase` keeps every `nav.go` inside this subtree on
 * `/desktop`, so the guard and the navigation agree about where "next" is.
 */
export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready } = useSession();
  const slug = pathname.split('/')[2] ?? '';

  return (
    <NavBase value="/desktop">
      <LayoutReconciler>
        <Guard key={ready ? slug : ' loading'} slug={slug}>
          {children}
        </Guard>
      </LayoutReconciler>
    </NavBase>
  );
}

function Guard({ slug, children }: { slug: string; children: React.ReactNode }) {
  const router = useRouter();
  const { s, ready } = useSession();

  // An *entry* check, evaluated once when the route opens - see the long note
  // in lib/nav.ts on why this must not re-run on state changes.
  const [blocked] = useState<Slug | null>(() => (ready ? firstRunBlock(slug, s) : null));

  const to = ready ? (blocked ?? redirectFor(slug, s)) : null;

  useEffect(() => {
    if (to) router.replace(`/desktop/${to}`);
  }, [to, router]);

  if (!ready || to) return null;

  // The same slug -> monument lookup the phone layout uses, set the same way:
  // a `display: contents` wrapper carries the custom property down to whichever
  // shell the screen renders, so no screen has to know it has a monument.
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
