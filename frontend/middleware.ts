import { NextResponse, type NextRequest } from 'next/server';
import { LAYOUT_COOKIE, isValidLayout, layoutFromUserAgent, targetFor, type Layout } from '@/lib/layout';

/**
 * Serve each visitor the layout that matches their device, without either tree
 * knowing about the other.
 *
 * Redirecting here rather than in the page means the wrong layout is never
 * generated, let alone painted - there is no flash to hide.
 *
 * Precedence is cookie first, user-agent second, and that order is what makes
 * the whole thing terminate. The client reconciler writes the cookie whenever
 * the UA guess disagrees with the real viewport, so a corrected visitor
 * arrives here already settled; without it, a narrow window on a desktop UA
 * would bounce between the two trees forever.
 *
 * Session state is deliberately not consulted - it lives in localStorage and
 * the edge cannot read it. It does not need to: only the base segment changes,
 * and the destination layout runs the same `redirectFor`/`firstRunBlock`
 * guards, so a visitor redirected mid-flow lands on the equivalent step.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const cookie = req.cookies.get(LAYOUT_COOKIE)?.value;
  const want: Layout = isValidLayout(cookie)
    ? cookie
    : layoutFromUserAgent(req.headers.get('user-agent') ?? '');

  const to = targetFor(pathname, want);
  if (!to) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = to;
  return NextResponse.redirect(url);
}

/**
 * Only the two trees. `/` is left to `app/page.tsx`, which resolves the base
 * from the same cookie once it can also read the session and pick the step.
 */
export const config = {
  matcher: ['/screens/:path*', '/desktop/:path*'],
};
