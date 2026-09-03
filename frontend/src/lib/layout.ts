/**
 * Which of the two layouts a request should be served.
 *
 * `/screens/*` and `/desktop/*` stay two separate route trees walking the same
 * slugs; this module is only the mapping between them, shared by the edge
 * middleware (server) and the reconciler (client) so the two can never
 * disagree about a destination.
 *
 * Precedence, everywhere: cookie > viewport (client) or user-agent (server).
 * The cookie is what a client correction and an explicit user choice both
 * write, and it is what stops the two layers redirecting at each other
 * forever - see `middleware.ts`.
 */

export type Layout = 'phone' | 'desktop';

export const LAYOUT_COOKIE = 'udyam.layout';

/** A year: the choice is a preference, not a session fact. */
export const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The one breakpoint. `desktop.css` folds the rail away below this and
 * `phone.css` stops widening the frame above it, so routing on any other
 * number would put the layout and the stylesheet at odds.
 */
export const DESKTOP_QUERY = '(min-width: 900px)';

export const BASE: Record<Layout, string> = { phone: '/screens', desktop: '/desktop' };

/**
 * Slugs that exist only in the phone tree. A desktop visitor is left on them
 * rather than bounced: desktop Settings links here on purpose, and there is no
 * desktop screen to redirect to.
 */
export const MOBILE_ONLY = ['edit-photo', 'edit-category'] as const;

export const isValidLayout = (v: unknown): v is Layout => v === 'phone' || v === 'desktop';

/** Which tree a pathname belongs to, or null if it is neither. */
export function layoutOf(pathname: string): Layout | null {
  if (pathname === '/screens' || pathname.startsWith('/screens/')) return 'phone';
  if (pathname === '/desktop' || pathname.startsWith('/desktop/')) return 'desktop';
  return null;
}

/** The slug after the base segment, or '' for the bare base. */
export function slugOf(pathname: string): string {
  return pathname.split('/')[2] ?? '';
}

/**
 * Where `pathname` should go for `want`, or null to leave it alone.
 *
 * Returns null when the path is already in the right tree, is not one of the
 * two trees, or names a slug the target tree does not have.
 */
export function targetFor(pathname: string, want: Layout): string | null {
  const at = layoutOf(pathname);
  if (at === null || at === want) return null;

  const slug = slugOf(pathname);
  if (want === 'desktop' && (MOBILE_ONLY as readonly string[]).includes(slug)) return null;

  return slug ? `${BASE[want]}/${slug}` : BASE[want];
}

/**
 * A deliberately small user-agent test, used only when no cookie has been set.
 * It is a first guess, not the answer: the client reconciles against the real
 * viewport on load and writes the cookie when this was wrong.
 */
const MOBILE_UA = /Android|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini|Mobile Safari/i;

export function layoutFromUserAgent(ua: string): Layout {
  return MOBILE_UA.test(ua) ? 'phone' : 'desktop';
}

/** The stored preference, or null when nothing has been settled yet. */
export function storedLayout(): Layout | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${LAYOUT_COOKIE}=`))
      ?.split('=')[1];
    return isValidLayout(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Writes the preference so the next request through middleware is settled. */
export function rememberLayout(layout: Layout) {
  try {
    document.cookie = `${LAYOUT_COOKIE}=${layout}; path=/; max-age=${LAYOUT_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    // a browser refusing cookies just means the UA guess is used every time
  }
}
