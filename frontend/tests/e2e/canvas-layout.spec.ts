import { test, expect, type Page } from '@playwright/test';

/**
 * Layout regression against `design/Disha Desktop.dc.html`.
 *
 * This exists because selector-and-content tests cannot see layout. An earlier
 * pass shipped all eight first-run screens as one centred column instead of the
 * three chromes the canvas specifies, and every content test still passed. The
 * numbers below are read off the artboards; measuring the rendered page against
 * them is the only check that would have failed.
 *
 * When the canvas changes, update SPEC in the same commit as the screens - a
 * diff here is either a real regression or a deliberate redesign, and both
 * should be visible in review.
 */

type Chrome = 'split' | 'topbar' | 'rail';

type Spec = {
  artboard: string;
  slug: string;
  chrome: Chrome;
  /** Fixed side panels, left to right, in CSS px. The rail counts as one. */
  asides: number[];
  /** Body padding exactly as the artboard sets it. */
  padding?: string;
  /** Column counts of the body's top-level grids, in document order. */
  grids?: number[];
  session: 'fresh' | 'identified' | 'located' | 'priced' | 'complete';
};

/** Session states, matching how far `redirectFor` lets a visitor reach. */
const SESSIONS = {
  base: {
    lang: 'en',
    name: '',
    phone: '9876543210',
    photo: null,
    verified: true,
    social: null,
    village: null,
    villageLgdCode: null,
    villageName: null,
    tehsil: null,
    radiusKm: 5,
    capital: null,
    business: null,
    savedAt: null,
  },
} as const;

const session = (kind: Spec['session']) => {
  const s: Record<string, unknown> = { ...SESSIONS.base };
  if (kind === 'fresh') return { ...s, verified: false };
  if (kind === 'identified') return { ...s, social: 'ST', name: 'Suresh Kharwar' };
  if (kind === 'located') return { ...s, social: 'ST', name: 'Suresh Kharwar', village: 'jarha' };
  if (kind === 'priced')
    return { ...s, social: 'ST', name: 'Suresh Kharwar', village: 'jarha', capital: 22000 };
  return {
    ...s,
    social: 'ST',
    name: 'Suresh Kharwar',
    village: 'jarha',
    villageName: 'Jarha',
    tehsil: 'Dudhi',
    capital: 22000,
    business: 'leaf-plates',
  };
};

const RAIL = 264;
/** The split chrome's navy branding panel: 46% of the 1440px canvas. */
const SPLIT = Math.round(1440 * 0.46);

const SPEC: Spec[] = [
  // --- onboarding: navy 46% branding panel beside the question ---------------
  { artboard: 'D-P1a', slug: 'language', chrome: 'split', asides: [SPLIT], grids: [2], session: 'fresh' },
  { artboard: 'D-P1b', slug: 'phone', chrome: 'split', asides: [SPLIT], session: 'fresh' },
  { artboard: 'D-P1c', slug: 'otp', chrome: 'split', asides: [SPLIT], session: 'fresh' },
  // --- onboarding: navy top bar, optional fixed side panel -------------------
  { artboard: 'D-P1d', slug: 'location', chrome: 'topbar', asides: [520], session: 'identified' },
  { artboard: 'D-P1e', slug: 'capital', chrome: 'topbar', asides: [460], session: 'located' },
  { artboard: 'D-P1f', slug: 'category', chrome: 'topbar', asides: [], grids: [6], session: 'priced' },
  { artboard: 'D-P10', slug: 'loading', chrome: 'topbar', asides: [], grids: [2, 2], session: 'complete' },
  // --- post-onboarding: 264px rail ------------------------------------------
  {
    artboard: 'D-P2',
    slug: 'feasibility',
    chrome: 'rail',
    asides: [RAIL],
    padding: '32px 40px',
    session: 'complete',
  },
  {
    artboard: 'D-P3',
    slug: 'swot',
    chrome: 'rail',
    asides: [RAIL],
    padding: '32px 40px',
    session: 'complete',
  },
  {
    artboard: 'D-P3a',
    slug: 'report',
    chrome: 'rail',
    asides: [RAIL, 380],
    padding: '32px 40px',
    session: 'complete',
  },
  {
    artboard: 'D-P3b',
    slug: 'competitors',
    chrome: 'rail',
    asides: [RAIL, 420],
    padding: '32px 40px',
    session: 'complete',
  },
  {
    artboard: 'D-P3c',
    slug: 'pricing',
    chrome: 'rail',
    asides: [RAIL],
    padding: '36px 44px',
    session: 'complete',
  },
  {
    artboard: 'D-P4',
    slug: 'scheme',
    chrome: 'rail',
    asides: [RAIL],
    padding: '32px 40px',
    session: 'complete',
  },
  {
    artboard: 'D-P5',
    slug: 'emi',
    chrome: 'rail',
    asides: [RAIL],
    padding: '32px 40px',
    session: 'complete',
  },
  {
    artboard: 'D-P6',
    slug: 'home',
    chrome: 'rail',
    asides: [RAIL],
    padding: '36px 44px',
    session: 'complete',
  },
  {
    artboard: 'D-P7',
    slug: 'share',
    chrome: 'rail',
    asides: [RAIL, 460],
    padding: '40px',
    session: 'complete',
  },
  {
    artboard: 'D-P8',
    slug: 'settings',
    chrome: 'rail',
    asides: [RAIL],
    padding: '40px 60px',
    session: 'complete',
  },
  {
    artboard: 'D-P9',
    slug: 'saved',
    chrome: 'rail',
    asides: [RAIL],
    padding: '36px 44px',
    session: 'complete',
  },
  {
    artboard: 'D-P11',
    slug: 'empty',
    chrome: 'rail',
    asides: [RAIL],
    padding: '36px 44px',
    session: 'complete',
  },
];

/** #E0670A - the canvas paints the active rail item saffron, not a tint. */
const SAFFRON = 'rgb(224, 103, 10)';

async function measure(page: Page) {
  return page.evaluate(() => {
    const px = (n: number) => Math.round(n);
    const asides = [...document.querySelectorAll('aside')].map((a) => px(a.getBoundingClientRect().width));
    const body = document.querySelector('.dc-desk-body') as HTMLElement | null;
    // the content container differs per chrome: the rail body, or the column
    // the onboarding chromes wrap their children in
    const host: HTMLElement | null =
      body ?? (document.querySelector('main > div') as HTMLElement | null) ?? document.querySelector('main');
    const grids = [...(host ? host.querySelectorAll(':scope > div') : [])]
      .filter((e) => getComputedStyle(e).display === 'grid')
      .map((e) => getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean).length);
    const active = document.querySelector('a[aria-current="page"]');
    return {
      asides,
      padding: body ? getComputedStyle(body).padding : null,
      grids,
      activeBg: active ? getComputedStyle(active).backgroundColor : null,
      hasRail: !!document.querySelector('.dc-desk-side'),
      hasOnb: !!document.querySelector('.dc-onb'),
      railWidth: document.querySelector('.dc-desk-side')
        ? px((document.querySelector('.dc-desk-side') as HTMLElement).getBoundingClientRect().width)
        : null,
      viewport: window.innerWidth,
    };
  });
}

test.describe('desktop layout matches the design canvas', () => {
  for (const spec of SPEC) {
    test(`${spec.artboard} · /desktop/${spec.slug}`, async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'disha.layout',
          value: 'desktop',
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ]);
      await page.addInitScript(
        ([s, otp]) => {
          localStorage.setItem('disha.session.v1', s as string);
          // the OTP screen needs a pending request or it bounces to phone
          if (otp) sessionStorage.setItem('disha.otp', otp as string);
        },
        [
          JSON.stringify(session(spec.session)),
          spec.slug === 'otp'
            ? JSON.stringify({ ok: true, phone_number: '+919876543210', expires_in_sec: 300, code_length: 4 })
            : '',
        ],
      );

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/desktop/${spec.slug}`);
      await expect(page).toHaveURL(new RegExp(`/desktop/${spec.slug}`));

      const m = await measure(page);
      expect(m.viewport, 'measured at the canvas width').toBe(1440);

      // the right chrome, not a wider version of the phone
      if (spec.chrome === 'rail') {
        expect(m.hasRail, `${spec.artboard} uses the rail chrome`).toBe(true);
        expect(m.railWidth, 'rail width from the artboard').toBe(RAIL);
      } else {
        expect(m.hasOnb, `${spec.artboard} uses an onboarding chrome`).toBe(true);
        expect(m.hasRail, 'onboarding screens carry no rail').toBe(false);
      }

      // fixed side panels, in order
      expect(m.asides, `${spec.artboard} side panels`).toEqual(spec.asides);

      if (spec.padding) {
        expect(m.padding, `${spec.artboard} body padding`).toBe(spec.padding);
      }
      if (spec.grids) {
        expect(m.grids.slice(0, spec.grids.length), `${spec.artboard} grid columns`).toEqual(spec.grids);
      }
      if (spec.chrome === 'rail' && m.activeBg) {
        expect(m.activeBg, 'active rail item is saffron').toBe(SAFFRON);
      }
    });
  }

  test('the split chrome puts the branding panel at 46%', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'disha.layout',
        value: 'desktop',
        domain: 'localhost',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/desktop/language');

    const pct = await page.evaluate(() => {
      const navy = [...document.querySelectorAll('aside')].find(
        (a) => getComputedStyle(a).backgroundColor === 'rgb(18, 59, 109)',
      );
      return navy ? (navy.getBoundingClientRect().width / window.innerWidth) * 100 : null;
    });
    expect(pct).not.toBeNull();
    expect(Math.round(pct as number), 'navy panel is 46% of the viewport').toBe(46);
  });
});
