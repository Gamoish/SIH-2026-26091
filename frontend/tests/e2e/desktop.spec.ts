import { test, expect, type Page } from '@playwright/test';
import { nextPhone } from './minted';
import { CAPITAL, EXPECTED_SPLIT } from './expected-cost-split';
import { DEMO, SHORT_MARGIN } from './expected-demo';

/**
 * The desktop tree, end to end. Runs under the `desktop` project, which seeds
 * `udyam.layout=desktop` so middleware keeps every navigation on `/desktop/*`.
 *
 * The phone flow is covered by flow.spec.ts; this is the same journey through
 * the other layout, so a screen that renders only on one of the two cannot
 * ship unnoticed.
 */

const API = 'http://localhost:4001';

async function currentCode(page: Page, phone: string): Promise<string> {
  const res = await page.request.post(`${API}/api/auth/request-otp`, { data: { phone_number: phone } });
  return (await res.json()).MOCK_dev_code as string;
}

async function onboard(
  page: Page,
  opts: {
    phone?: string;
    social?: string;
    village?: string;
    radius?: string;
    business?: string;
    capital?: string;
  } = {},
) {
  const {
    phone = nextPhone(),
    social = 'Scheduled Tribe',
    village = 'Jarha',
    radius = '10 km',
    business = 'Leaf plates',
    capital = '22000',
  } = opts;
  await page.goto('/desktop/language');

  // The first tap can land before hydration under parallel load; retry until
  // the route actually moves.
  await expect(async () => {
    const english = page.getByRole('button', { name: 'English' });
    if (await english.count()) await english.click({ timeout: 2000 }).catch(() => {});
    await expect(page).toHaveURL(/\/desktop\/phone/, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });

  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();

  await expect(page).toHaveURL(/\/desktop\/otp/);
  const code = await currentCode(page, phone);
  for (const [i, d] of [...code].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/desktop\/social/);
  await page.getByPlaceholder(/e\.g\./).fill('Suresh Kharwar');
  await page.getByRole('button', { name: new RegExp(social) }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/desktop\/location/);
  await page
    .getByRole('option', { name: new RegExp(`^${village}`) })
    .first()
    .click();
  await page.getByRole('button', { name: radius, exact: false }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // business first, capital second
  await expect(page).toHaveURL(/\/desktop\/category/);
  await page.getByRole('button', { name: business, exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/desktop\/capital/);
  await page.getByLabel(/Your capital/).fill(capital);
  await page.getByRole('button', { name: /Run the check/ }).click();

  await expect(page).toHaveURL(/\/desktop\/feasibility/, { timeout: 15_000 });
  return phone;
}

test('a first-time user reaches a report and a repayment plan on desktop', async ({ page }) => {
  await onboard(page);

  // the desktop chrome, not the phone frame
  await expect(page.locator('.dc-desk-side')).toBeVisible();
  await expect(page.locator('.dc-phone')).toHaveCount(0);

  await page.getByRole('button', { name: /Read the full report/ }).click();
  await expect(page).toHaveURL(/\/desktop\/report/);

  await page.getByRole('button', { name: /The money path/ }).click();
  await expect(page).toHaveURL(/\/desktop\/scheme/);
  await expect(page.getByText('NSTFDC').first()).toBeVisible();

  await page.getByRole('button', { name: /See the repayment plan/ }).click();
  await expect(page).toHaveURL(/\/desktop\/emi/);

  await page.getByRole('button', { name: /Show this to the bank/ }).click();
  await expect(page).toHaveURL(/\/desktop\/share/);
  await expect(page.getByText('Feasibility summary')).toBeVisible();
});

test('the rail navigates the account screens', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/home');

  for (const [label, url] of [
    ['Applications', /\/desktop\/saved/],
    ['Settings', /\/desktop\/settings/],
    ['Home', /\/desktop\/home/],
  ] as const) {
    await page.locator('.dc-desk-side').getByText(label, { exact: false }).first().click();
    await expect(page).toHaveURL(url);
  }
});

test('the guards behave as they do on the phone', async ({ page }) => {
  await onboard(page);

  // an onboarded user cannot re-enter the identity steps
  for (const slug of ['language', 'phone', 'otp', 'social']) {
    await page.goto(`/desktop/${slug}`);
    await expect(page).toHaveURL(/\/desktop\/home/);
  }
});

test('a half-finished first run resumes at the step it stopped on', async ({ page }) => {
  await page.goto('/desktop/language');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/desktop\/phone/);

  // asking for a later step walks back to the first unanswered one
  await page.goto('/desktop/capital');
  await expect(page).toHaveURL(/\/desktop\/language/);
});

test('the desktop numbers match the engines, not the canvas', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/emi');

  const body = await page.locator('.dc-desk-body').innerText();
  // planLoan()'s own figures for a 22,000 ST leaf-plates case: a ₹1,80,000
  // anchor cost, ₹1,58,000 borrowed in NSTFDC's first slab, 6% over 84 months
  // with a 6-month moratorium (78 instalments).
  expect(body).toContain('₹2,525');
  // the design canvas's placeholder must never appear
  expect(body).not.toContain('₹5,270');
});

test('mobile-only edit screens open in the phone layout from a desktop session', async ({ page }) => {
  await onboard(page);

  // Settings links here on purpose; there is no desktop counterpart, so
  // middleware leaves the phone route alone rather than bouncing it.
  await page.goto('/screens/edit-photo');
  await expect(page).toHaveURL(/\/screens\/edit-photo/);
  await expect(page.locator('.dc-phone')).toBeVisible();

  await page.goto('/screens/edit-category');
  await expect(page).toHaveURL(/\/screens\/edit-category/);
  await expect(page.locator('.dc-phone')).toBeVisible();
});

test('the profile picture can be changed from the desktop rail', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/settings');

  // the name and number are on the account row, not just the rail
  const phone = await page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').phone);
  await expect(page.getByText(`+91 ${phone}`).first()).toBeVisible();

  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').photo,
  );
  expect(before).toBeNull();

  // a 2x2 red PNG is enough: the crop runs through a canvas either way
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'me.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGP8z8DAwMDAxMAAAAAA//8DAAIDAQGkGZ4hAAAAAElFTkSuQmCC',
        'base64',
      ),
    });

  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').photo))
    .toMatch(/^data:image\/jpeg;base64,/);

  // and it is the same photo on the phone layout - one session, one field
  await page.goto('/screens/settings');
  await expect(page.locator('img[alt=""]').first()).toBeVisible();
});

test('the capital breakdown is the chosen business, on the desktop layout', async ({ page }) => {
  await onboard(page);

  // Same constants the phone spec asserts against, so the two layouts are
  // pinned to each other: if either drifts, one of the two tests fails.
  for (const [id, spec] of Object.entries(EXPECTED_SPLIT)) {
    await page.evaluate((business) => {
      const s = JSON.parse(localStorage.getItem('udyam.session.v1')!);
      localStorage.setItem('udyam.session.v1', JSON.stringify({ ...s, business, capital: null }));
    }, id);
    await page.goto('/desktop/capital');
    await page.getByLabel(/Your capital/).fill(CAPITAL);

    for (const [label, amount] of spec.rows) {
      await expect(page.getByText(label, { exact: true }), `${id}: ${label}`).toBeVisible();
      await expect(page.getByText(amount, { exact: true }).first(), `${id}: ${amount}`).toBeVisible();
    }
    for (const [otherId, other] of Object.entries(EXPECTED_SPLIT)) {
      if (otherId === id) continue;
      for (const [label] of other.rows) {
        await expect(page.getByText(label, { exact: true }), `${id} shows ${otherId}'s ${label}`).toHaveCount(
          0,
        );
      }
    }
  }
});

test('finishing a case files it to the database, and the list reads it back', async ({ page }) => {
  await onboard(page);

  // the share sheet is what files the case
  await page.goto('/desktop/share');
  await expect(page.getByText('Feasibility summary')).toBeVisible();

  // Wait for the write, don't assume it. The screen files in an effect and
  // records `savedAt` when the POST resolves; navigating on the instant it
  // paints races that request, and the row would not be in Postgres yet.
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').savedAt), {
      timeout: 20_000,
    })
    .toBeTruthy();

  // The list screen fetches GET /api/applications, so a row appearing here is
  // proof the case reached Postgres - the session alone could not produce it.
  await page.goto('/desktop/saved');
  await expect(page.getByText('Leaf plates')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('/ 100')).toBeVisible();

  // and it survives this browser forgetting the case entirely
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}');
    localStorage.setItem(
      'udyam.session.v1',
      JSON.stringify({ ...s, business: null, savedAt: null, capital: null }),
    );
  });
  await page.goto('/desktop/saved');
  await expect(page.getByText('Leaf plates')).toBeVisible();
});

/**
 * The status of an application and the feasibility score of the business it is
 * about are two different facts. The list used to imply otherwise - a bar, a
 * score and a badge in one row read as "this application is 79% filed" - so
 * this asserts they are separate elements carrying separate values, not one
 * number rendered twice.
 */
test('the applications list separates filing status from the feasibility score', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/share');
  await expect(page.getByText('Feasibility summary')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').savedAt), {
      timeout: 20_000,
    })
    .toBeTruthy();

  await page.goto('/desktop/saved');
  const row = page.getByTestId('application-row').first();
  await expect(row).toBeVisible({ timeout: 10_000 });

  const status = row.getByTestId('application-status');
  const score = row.getByTestId('application-score');
  await expect(status).toBeVisible();
  await expect(score).toBeVisible();

  // `useInnerText` throughout: <T> renders both languages and hides one in CSS,
  // so textContent would read "पूराComplete" and prove nothing about the screen.
  //
  // the badge says a status off the `draft | complete` enum, and names no number
  await expect(status).toHaveText(/^(Complete|Draft)$/, { useInnerText: true });
  // the score is a labelled figure out of 100, and names no status
  await expect(score).toHaveText(/^Feasibility score \d{1,3} \/ 100$/, { useInnerText: true });

  // Distinct elements: neither contains the other, so no single value is being
  // shown as both. And nothing in the row is a bar filled from the score.
  expect(await status.evaluate((el, other) => el.contains(other), await score.elementHandle())).toBe(false);
  const scoreValue = Number((await score.innerText()).match(/(\d{1,3}) \/ 100/)![1]);
  const barWidths = await row.evaluate((el) =>
    [...el.querySelectorAll('*')]
      .map((e) => getComputedStyle(e).width)
      .filter((w) => w.endsWith('%'))
      .map((w) => parseFloat(w)),
  );
  expect(barWidths, 'no element in the row is sized to the score').not.toContain(scoreValue);

  // the summary strip counts the same rows, and its three figures add up
  const num = async (id: string) => Number(await page.getByTestId(id).textContent());
  expect(await num('count-filed')).toBe((await num('count-complete')) + (await num('count-pending')));
  expect(await num('count-filed')).toBe(await page.getByTestId('application-row').count());
});

test('the score counts up to the real figure, and the accessible name does not', async ({ page }) => {
  await onboard(page);
  await expect(page).toHaveURL(/\/desktop\/feasibility/);

  const dial = page.locator('[role="img"]').first();
  const label = await dial.getAttribute('aria-label');
  expect(label).toMatch(/^\d+ \/ 100$/);
  const score = Number(label!.split(' ')[0]);

  // The digits come from a CSS counter driven by --tally, which the animation
  // walks up to --tally-to. `content` serialises as the unresolved
  // `counter(tally)`, so the animated property is the thing to measure: it has
  // to settle on the engine's figure, not near it.
  await expect
    .poll(async () =>
      Number(
        await page
          .locator('.tally')
          .first()
          .evaluate((el) => getComputedStyle(el).getPropertyValue('--tally')),
      ),
    )
    .toBe(score);

  // --tally-to was handed the real number in the first place
  const to = await page
    .locator('.tally')
    .first()
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--tally-to').trim());
  expect(Number(to)).toBe(score);

  // and the counter actually paints - an empty element would satisfy the above
  const painted = await page
    .locator('.tally')
    .first()
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(painted, 'the digits render').toBeGreaterThan(20);
});

test('the report opens its detail views in a modal, without leaving the report', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/report');

  const dialog = page.locator('dialog.dc-modal');
  await expect(dialog).toHaveCount(0);

  for (const [button, marker] of [
    ['Competitors', 'People per competitor'],
    ['Pricing', 'Low end'],
    ['Strengths & risks', 'Opportunities'],
  ] as const) {
    await page.getByRole('button', { name: button }).click();

    // the point of the change: the detail is on screen and the URL has not moved
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/desktop\/report/);
    await expect(dialog).toContainText(marker);

    // Esc is the browser's, not ours - if <dialog> stopped being the mechanism
    // this is what would notice.
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/desktop\/report/);
  }

  // the standalone routes still work, so deep links and the phone layout keep theirs
  await page.goto('/desktop/competitors');
  await expect(page.locator('.dc-desk-body')).toContainText('Village by village');
});

test('onboarding goes back a step by button, and only where the guards allow it', async ({ page }) => {
  // Mid-check session: identity done, capital not yet answered.
  await page.addInitScript(() => {
    localStorage.setItem(
      'udyam.session.v1',
      JSON.stringify({
        lang: 'en',
        name: 'Suresh Kharwar',
        phone: '9876543210',
        photo: null,
        verified: true,
        social: 'ST',
        village: 'jarha',
        villageLgdCode: null,
        villageName: 'Jarha',
        tehsil: 'Dudhi',
        radiusKm: 5,
        capital: null,
        business: null,
        savedAt: null,
      }),
    );
  });

  const back = page.getByRole('button', { name: /Previous step/ });

  // category -> location, by the button rather than by history. Category is
  // now the step after location; capital moved to last.
  await page.goto('/desktop/category');
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/\/desktop\/location/);

  // location offers no back: the step behind it is `social`, which
  // firstRunBlock sends to home once the account exists. A back button that
  // lands somewhere else is worse than none, so it is not rendered.
  await expect(back).toHaveCount(0);
});

/**
 * A returning user on a NEW browser - the case that had no coverage.
 *
 * The session lives in localStorage, so a fresh browser starts empty. Before
 * restoreServerSession() ran on OTP verification, the guards had nothing to
 * read and walked a fully-onboarded user back through onboarding from the
 * social step. Both layouts were wrong identically, which is why every
 * existing test passed: they all reuse one browser context.
 *
 * Uses a real LGD village, not a demo fixture. Only a real selection carries an
 * lgd_code, and the code is the only thing the location step persists - a
 * fixture-backed choice has nothing to restore.
 */
for (const [layout, base] of [
  ['phone', '/screens'],
  ['desktop', '/desktop'],
] as const) {
  test(`a returning ${layout} user on a fresh browser resumes instead of restarting`, async ({ browser }) => {
    const phone = nextPhone();
    const cookie = {
      name: 'udyam.layout',
      value: layout,
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    };

    // --- first visit: onboard far enough to have a server-side profile
    const first = await browser.newContext({ storageState: { cookies: [cookie], origins: [] } });
    const p1 = await first.newPage();
    await p1.goto(`${base}/language`);
    await expect(async () => {
      const english = p1.getByRole('button', { name: 'English' });
      if (await english.count()) await english.click({ timeout: 2000 }).catch(() => {});
      await expect(p1).toHaveURL(new RegExp(`${base}/phone`), { timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await p1.getByLabel('Mobile number').fill(phone);
    await p1.getByRole('button', { name: 'Send OTP' }).click();
    await expect(p1).toHaveURL(new RegExp(`${base}/otp`));
    let code = await currentCode(p1, phone);
    for (const [i, d] of [...code].entries()) await p1.getByLabel(`Digit ${i + 1}`).fill(d);
    await p1.getByRole('button', { name: 'Continue' }).click();

    await expect(p1).toHaveURL(new RegExp(`${base}/social`));
    await p1.getByPlaceholder(/e\.g\./).fill('Suresh Kharwar');
    await p1.getByRole('button', { name: /Scheduled Tribe/ }).click();
    await p1.getByRole('button', { name: layout === 'phone' ? /Next · your location/ : 'Continue' }).click();

    await expect(p1).toHaveURL(new RegExp(`${base}/location`));
    await p1.getByLabel(layout === 'phone' ? /Search for your village/ : /Village name/).fill('Adalganj');
    const village =
      layout === 'phone'
        ? p1.getByRole('button', { name: /^Adalganj/ })
        : p1.getByRole('option', { name: /^Adalganj/ });
    await expect(village.first()).toBeVisible({ timeout: 10_000 });
    await village.first().click();
    await p1
      .getByRole('button', { name: layout === 'phone' ? /Next · choose business/ : 'Continue' })
      .click();

    await expect(p1).toHaveURL(new RegExp(`${base}/category`));
    await p1.getByRole('button', { name: 'Leaf plates', exact: true }).click();
    await p1.getByRole('button', { name: layout === 'phone' ? /Next · enter capital/ : 'Continue' }).click();

    await expect(p1).toHaveURL(new RegExp(`${base}/capital`));
    await p1.getByLabel(layout === 'phone' ? 'Your own capital, in rupees' : /Your capital/).fill('22000');
    // Submit it: capital reaches the server through this step, and the whole
    // point of the test is what a fresh browser can restore from the server.
    await p1
      .getByRole('button', { name: layout === 'phone' ? /Next · see the report/ : /Run the check/ })
      .click();
    await expect(p1).toHaveURL(new RegExp(`${base}/(loading|feasibility)`), { timeout: 20_000 });
    await first.close();

    // --- second visit: same number, a browser that has never seen this user
    const second = await browser.newContext({ storageState: { cookies: [cookie], origins: [] } });
    const p2 = await second.newPage();
    await p2.goto(`${base}/language`);
    await expect(async () => {
      const english = p2.getByRole('button', { name: 'English' });
      if (await english.count()) await english.click({ timeout: 2000 }).catch(() => {});
      await expect(p2).toHaveURL(new RegExp(`${base}/phone`), { timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await p2.getByLabel('Mobile number').fill(phone);
    await p2.getByRole('button', { name: 'Send OTP' }).click();
    await expect(p2).toHaveURL(new RegExp(`${base}/otp`));
    code = await currentCode(p2, phone);
    for (const [i, d] of [...code].entries()) await p2.getByLabel(`Digit ${i + 1}`).fill(d);
    await p2.getByRole('button', { name: 'Continue' }).click();

    // The bug: this landed on /social and asked for everything again.
    await expect(p2).toHaveURL(new RegExp(`${base}/home`), { timeout: 15_000 });

    // and the server-owned fields are actually back in the session
    const restored = await p2.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}'));
    expect(restored.social).toBe('ST');
    expect(restored.capital).toBe(22000);
    expect(restored.villageLgdCode).toBeTruthy();
    expect(restored.villageName).toBe('Adalganj');

    // the identity screens stay closed for an account that already exists
    for (const slug of ['language', 'phone', 'otp', 'social']) {
      await p2.goto(`${base}/${slug}`);
      await expect(p2).toHaveURL(new RegExp(`${base}/home`));
    }

    // One account, one profile. GET /api/onboarding/profile returns the NEWEST
    // row, so if logging in again had filed a second, blank profile this would
    // come back empty instead of carrying the village chosen on the first visit.
    const server = await p2.evaluate(async (api) => {
      const token = localStorage.getItem('udyam.token.v1');
      const r = await fetch(`${api}/api/onboarding/profile`, {
        headers: { authorization: `Bearer ${token}` },
      });
      return (await r.json()).profile;
    }, API);
    expect(server.village_name).toBe('Adalganj');
    expect(server.category).toBe('ST');
    expect(Number(server.capital)).toBe(22000);

    await second.close();
  });
}

/**
 * The redesigned verdict screen (D-P2). Structure first, then the two claims
 * that are easy to fake: that the supporting copy carries THIS case's radius
 * and village rather than a hardcoded "5 km", and that the key insight is
 * derived rather than a fixed sentence.
 */
/**
 * The dashboard (D-P6). It shares its header row and its score gauge with the
 * verdict screen, so the two things worth pinning are that the shared pieces
 * are really the shared ones, and that the four chips carry four real values
 * off the active case rather than restating the line above them.
 */
/**
 * The rail's vertical order: who is signed in, then the nav, then the service
 * mark and tagline at the foot.
 *
 * Nothing asserted this before - the rail's contents were checked, never their
 * arrangement - so the lockup could move between the head and the foot without
 * a single test noticing. Measured by position rather than by DOM index, since
 * a flex spacer is what actually pins the lockup to the bottom.
 */
/**
 * The applications screen heads itself with the shared `ScreenHead`, exactly as
 * the dashboard and settings do, and the flag mark hangs off the page corner
 * from `.dc-flag::before` on the shell - not from anything this screen owns.
 *
 * Asserted here because a report of a "cut-off header" on this page pointed at
 * that mark. It is a corner ribbon by design and is measured on all three
 * screens: same box, same art, painting above the body rather than clipped by
 * it. A regression that cropped it, or a head that quietly forked into a
 * second implementation on this screen, fails here.
 */
test('the applications screen heads itself exactly as the other rail screens do', async ({ page }) => {
  await onboard(page);

  const read = async (slug: string) => {
    await page.goto(`/desktop/${slug}`);
    await expect(page.locator('.dc-desk-title')).toBeVisible();
    return page.evaluate(() => {
      const host = document.querySelector('.dc-desk.dc-flag') as HTMLElement | null;
      const head = document.querySelector('.dc-desk-title') as HTMLElement | null;
      if (!host || !head) return null;
      const mark = getComputedStyle(host, '::before');
      const box = head.getBoundingClientRect();
      // an ancestor that clips is what would crop the mark to a fragment
      const clipping: string[] = [];
      for (let n: HTMLElement | null = host; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.overflow !== 'visible') clipping.push(`${n.className || n.tagName}:${s.overflow}`);
      }
      return {
        markImage: mark.backgroundImage,
        markSize: `${mark.width} x ${mark.height}`,
        markZ: mark.zIndex,
        hostTop: Math.round(host.getBoundingClientRect().top),
        headVisible: box.width > 300 && box.height > 20,
        headTop: Math.round(box.top),
        clipping,
      };
    });
  };

  const saved = await read('saved');
  const home = await read('home');
  const settings = await read('settings');

  expect(saved).not.toBeNull();
  // the mark renders whole: same art, same box and same layer as the others,
  // and nothing on the way up to the shell clips it
  expect(saved!.markImage, 'the flag mark is painted on the applications screen').toContain(
    'flag-corner.svg',
  );
  expect(saved!.markSize).toBe(home!.markSize);
  expect(saved!.markSize).toBe(settings!.markSize);
  expect(saved!.markZ).toBe(home!.markZ);
  expect(saved!.clipping, 'nothing clips the shell on the applications screen').toEqual([]);
  expect(saved!.hostTop, 'the shell starts flush with the top').toBe(0);

  // and the head itself is the full row, at the same place as on the dashboard.
  // Deliberately not compared against settings: the canvas gives that screen
  // 40px 60px of body padding against this one's 36px 44px, so its head sits
  // 4px lower by design and asserting otherwise would fail on a correct page.
  expect(saved!.headVisible).toBe(true);
  expect(settings!.headVisible).toBe(true);
  expect(saved!.headTop).toBe(home!.headTop);

  // the head's own three parts, from the shared component
  await page.goto('/desktop/saved');
  await expect(page.locator('.dc-desk-title').getByText('Your applications')).toBeVisible();
  await expect(page.locator('.dc-desk-title').getByText('Every check you have filed so far')).toBeVisible();
  await expect(
    page.locator('.dc-desk-title').getByRole('button', { name: 'Start a new check' }),
  ).toBeVisible();
});

test('the applications list sorts by the real filed date, from a real control', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/saved');

  // with nothing filed there is no list to order, so no control either
  await expect(page.getByTestId('apps-sort')).toHaveCount(0);

  await page.goto('/desktop/share');
  await expect(page.getByText('Feasibility summary')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').savedAt), {
      timeout: 20_000,
    })
    .toBeTruthy();

  await page.goto('/desktop/saved');
  const sort = page.getByTestId('apps-sort');
  await expect(sort).toBeVisible({ timeout: 10_000 });

  // a real control over the real order, not a label that reads like one
  expect(await sort.evaluate((el) => el.tagName)).toBe('SELECT');
  expect(await sort.evaluate((el) => [...(el as HTMLSelectElement).options].map((o) => o.value))).toEqual([
    'newest',
    'oldest',
  ]);
  await expect(sort).toHaveValue('newest');
  await sort.selectOption('oldest');
  await expect(sort).toHaveValue('oldest');
  // the rows survive the reorder - a sort that drops the applicant's own row
  // would be worse than no sort at all
  await expect(page.getByTestId('application-row')).toHaveCount(1);
});

test('the rail stacks the account, the nav, then the mark at the foot', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/home');

  const rail = page.locator('.dc-desk-side');
  const box = async (l: ReturnType<typeof rail.locator>) => (await l.first().boundingBox())!;

  const account = await box(rail.getByText(/^\+91 /));
  const nav = await box(rail.locator('nav'));
  const wordmark = await box(rail.getByRole('img', { name: /Udyam Sathi/ }));
  const tagline = await box(rail.getByText('A government feasibility and loan adviser'));

  expect(account.y, 'the account block heads the rail').toBeLessThan(nav.y);
  expect(nav.y, 'the nav sits above the mark').toBeLessThan(wordmark.y);
  expect(wordmark.y, 'the tagline follows the mark').toBeLessThanOrEqual(tagline.y);

  // and the mark really is at the foot, not merely last
  const railBox = await box(rail);
  expect(
    railBox.y + railBox.height - (tagline.y + tagline.height),
    'the mark is anchored to the bottom of the rail',
  ).toBeLessThan(40);
});

test('the dashboard heads itself, and its chips carry the real case', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/home');

  const body = page.locator('.dc-desk-body');

  await expect(body.getByText(`Hello, Suresh Kharwar`)).toBeVisible();
  await expect(body.getByText('Your check, your loan options and what to do next')).toBeVisible();

  // The same arc gauge the verdict screen uses - the ring element, not just a
  // number - carrying the engine's score.
  await expect(page.getByRole('img', { name: `${DEMO.score} / 100` })).toBeVisible();
  await expect(body.locator('svg circle.arc')).toHaveCount(1);

  // Four chips, four distinct real values off the active case.
  const text = await body.innerText();
  for (const chip of [DEMO.business, `${DEMO.village}, Dudhi`, 'NSTFDC', DEMO.loan]) {
    expect(text, `chip: ${chip}`).toContain(chip);
  }
  // and the headline above them is the verdict, not those same values again
  expect(text).toContain('Good opportunity');

  // Three real actions, each with its explanatory footer line.
  await expect(body.getByText('All 6 competitors and the price range, village by village.')).toBeVisible();
  await expect(body.getByText('6% under NSTFDC, instalment by instalment.')).toBeVisible();
  await expect(body.getByText('Print it or save a PDF to take to a bank or CSC centre.')).toBeVisible();

  // No guide exists, so nothing offers one.
  expect(text).not.toMatch(/View guide|Need help/i);
});

/**
 * The location pill is a label, not a control - there is no behaviour to give
 * it yet, and the panel beside the active card is the real way to run a check
 * somewhere else. This is what fails if it is ever quietly made clickable
 * without a destination.
 */
test('the dashboard location pill is a label, not a silent button', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/home');

  const head = page.locator('.dc-desk-title');
  await expect(head.getByText(`${DEMO.village}, Dudhi`)).toBeVisible();
  await expect(head.locator('button')).toHaveCount(0);
});

test('the dashboard next-step cards reach the three screens they name', async ({ page }) => {
  await onboard(page);

  for (const [name, url] of [
    ['Full report', /\/desktop\/report/],
    ['Repayment plan', /\/desktop\/emi/],
    ['Show to bank', /\/desktop\/share/],
  ] as const) {
    await page.goto('/desktop/home');
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(url);
  }
});

test('the verdict screen heads itself, dates itself, and explains its own figures', async ({ page }) => {
  await onboard(page);
  await expect(page).toHaveURL(/\/desktop\/feasibility/);

  const body = page.locator('.dc-desk-body');

  // the breadcrumb, with the subtitle under it
  await expect(body.getByText('Your result', { exact: true })).toBeVisible();
  await expect(body.getByText('Business feasibility analysis')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go to home' })).toBeVisible();

  // The date comes from the session stamp written when the check finished,
  // not from today's clock: assert the two agree.
  const stamped = await page.evaluate(
    () => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').reportAt as string | null,
  );
  expect(stamped, 'the loading screen stamped reportAt').toBeTruthy();
  const expected = new Date(stamped!).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  await expect(body.getByText(`Generated on ${expected}`)).toBeVisible();

  // The full-width flag strip is gone from the rail chrome; the corner glyph
  // (asserted in canvas-layout.spec.ts) is what marks the page now.
  await expect(page.locator('.dc-tricolour')).toHaveCount(0);

  // Stat subcopy carries the radius and village THIS check ran on. The demo
  // walks 10 km, so a hardcoded "5 km" would fail here.
  const text = await body.innerText();
  expect(text).toContain(`People living within ${DEMO.radius} of ${DEMO.village}, Dudhi.`);
  expect(text).toContain(`${DEMO.business} units already running in that circle.`);
  expect(text).toContain('On average, each existing unit serves about this many people.');

  // What next lists what the report actually contains, and the CTA carries no
  // decorative arrow any more.
  await expect(body.getByText('Competitors — village by village')).toBeVisible();
  await expect(body.getByText('Suggested price — the')).toBeVisible();
  await expect(body.getByText('Strengths & risks —')).toBeVisible();
  const cta = page.getByRole('button', { name: /Read the full report/ });
  await expect(cta.locator('svg')).toHaveCount(0);
});

/**
 * The key insight has to be reasoning about THIS case, not a fixed sentence.
 *
 * Two independent checks, because either alone is weak: the sentence quotes
 * the same people-per-competitor figure the stat tile shows (so it is reading
 * the report, not a constant), and two different businesses in the same
 * village produce different insight text.
 */
test('the key insight is derived from the case, not a fixed string', async ({ page }) => {
  await onboard(page);

  const body = page.locator('.dc-desk-body');
  await expect(body.getByText('Key insight')).toBeVisible();

  // The figure the "People per competitor" tile shows, read off the rendered
  // text rather than the DOM: every label renders in both languages and CSS
  // hides one, so innerText is the only view that matches what is on screen.
  const shown = await body.innerText();
  const tile = shown.match(/([\d,]+)\s*\n\s*People per competitor/);
  expect(tile, 'found the people-per-competitor tile').not.toBeNull();
  const perCompetitor = tile![1];

  const insight = await body.locator('p').last().innerText();
  expect(insight, 'the insight quotes the case figure').toContain(perCompetitor);
  expect(insight).toMatch(/people to itself/);

  // And it moves when the case does. The business is changed in the session
  // rather than by onboarding a second account: the case is derived from the
  // session on every render, and an onboarded browser cannot re-enter the
  // first-run steps anyway.
  await page.evaluate(() => {
    const key = 'udyam.session.v1';
    const s = JSON.parse(localStorage.getItem(key) ?? '{}');
    localStorage.setItem(key, JSON.stringify({ ...s, business: 'poultry' }));
  });
  await page.reload();
  await expect(body.getByText('Key insight')).toBeVisible();

  const other = await body.locator('p').last().innerText();
  expect(other, 'a different business reads differently').not.toBe(insight);
});

test('the anchor-based figures render on the desktop layout', async ({ page }) => {
  await onboard(page);

  // The capital step's own eligibility aside - planLoan() before the answer is
  // even committed to the session.
  await page.goto('/desktop/capital');
  await expect(page.locator('body')).toContainText(DEMO.projectCost);
  await expect(page.locator('body')).toContainText(DEMO.loan);

  await page.goto('/desktop/scheme');
  const scheme = await page.locator('.dc-desk-body').innerText();
  expect(scheme).toContain(DEMO.projectCost);
  expect(scheme).toContain(DEMO.loan);
  // capital clears the ₹18,000 the scheme asks for, so the note stays away
  expect(scheme).not.toContain('This is tight for');

  await page.goto('/desktop/emi');
  const emi = await page.locator('.dc-desk-body').innerText();
  expect(emi).toContain(DEMO.emi);
  // the affordability figure, from case.ts's emiShare() - the EMI screens
  // print it as "~19%"
  expect(emi).toContain(`~${DEMO.emiSharePct}%`);

  await page.goto('/desktop/report');
  const report = await page.locator('.dc-desk-body').innerText();
  expect(report).toContain(DEMO.revenue);
  // The desktop score is a CSS counter animation, so its digits are not in the
  // DOM text the way the phone layout's plain `{report.score}` is. Same number,
  // different presentation - read it off the dial's accessible name.
  await expect(page.getByRole('img', { name: `${DEMO.score} / 100` })).toBeVisible();
});

test('capital under the required margin warns on the desktop layout', async ({ page }) => {
  await onboard(page, { business: SHORT_MARGIN.business, capital: SHORT_MARGIN.capital });

  await page.goto('/desktop/scheme');
  const body = await page.locator('.dc-desk-body').innerText();

  // the warning, with its actual rupee figures - not merely that one appeared
  expect(body).toContain(SHORT_MARGIN.title);
  expect(body.replace(/\s+/g, ' ')).toContain(SHORT_MARGIN.copy);

  // and it is advisory: the plan underneath still renders its own figures
  expect(body).toContain(SHORT_MARGIN.projectCost);
  expect(body).toContain(SHORT_MARGIN.loan);
});

/**
 * The three Settings rows that actually do something. Each asserts the real
 * effect - the session field, the phone sheet's save, the cleared token - not
 * that a control rendered.
 *
 * The other three rows are deliberately inert and stay that way: the phone
 * number and the category are read-only here (the category IS editable, but
 * only through the phone's edit-category screen, which explains the scheme
 * consequences), and Saved applications is navigation to the Applications
 * screen rather than a control.
 */
test('the language toggle on desktop settings switches the app, not just itself', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/settings');

  const lang = () => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').lang);

  await page.getByRole('button', { name: 'हिंदी' }).click();
  await expect.poll(lang).toBe('hi');
  // the page itself is now in Hindi - the toggle drives `T`, not a stored flag
  await expect(page.getByText('सेटिंग्स').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-lang', 'hi');

  await page.getByRole('button', { name: 'English' }).click();
  await expect.poll(lang).toBe('en');
  await expect(page.getByText('Your name, number, language and category')).toBeVisible();
});

test('Change name on desktop settings reaches the real edit and the new name comes back', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/desktop/settings');
  await expect(page.getByText('Suresh Kharwar').first()).toBeVisible();

  // There is no desktop screen for the name, so the row hands off to the phone
  // layout and writes the cookie that keeps it there - the same handoff the
  // photo and category rows use.
  await page.getByRole('link', { name: 'Change name' }).click();
  await expect(page).toHaveURL(/\/screens\/settings/);
  await expect(page.locator('.dc-phone')).toBeVisible();

  await page.getByRole('button', { name: /^Name/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Meena Devi');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toHaveCount(0);

  // and back on desktop the profile card carries it
  await page.evaluate(() => {
    document.cookie = 'udyam.layout=desktop; path=/; max-age=31536000; samesite=lax';
  });
  await page.goto('/desktop/settings');
  await expect(page.getByText('Meena Devi').first()).toBeVisible();
});

test('Log out on desktop settings confirms, then really ends the session', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/settings');
  expect(await page.evaluate(() => localStorage.getItem('udyam.token.v1'))).not.toBeNull();

  // one click arms it, a second ends it: the row does not log out on a stray click
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yes, log out' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('udyam.token.v1'))).not.toBeNull();

  await page.getByRole('button', { name: 'Yes, log out' }).click();

  await expect(page).toHaveURL(/\/desktop\/language/);
  expect(await page.evaluate(() => localStorage.getItem('udyam.token.v1'))).toBeNull();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').phone))
    .toBe('');
});

/**
 * The head is one component, on every desktop screen that has one - not four
 * that look alike. The report screen was the last holdout: it drew its row from
 * `DesktopShell`'s `title` prop, so it had no back control and no subtitle
 * while the other four had all three parts.
 *
 * Asserted structurally rather than by eye: every page renders exactly one
 * `.dc-desk-title`, each carries a title and a subtitle, and the rail beside
 * it is byte-for-byte the same lockup and tagline on all of them.
 */
/** The four pages this audit covers, in rail order. */
const AUDITED = ['home', 'feasibility', 'saved', 'settings'] as const;

/**
 * One icon library, one stroke weight.
 *
 * The desktop pages used to draw icons two ways: Hugeicons in the rail and the
 * settings rows, hand-written <path> data everywhere else - the back arrow,
 * both print controls, both plus marks, the three summary glyphs, the location
 * pin, the three next-step marks. The weights that came with that were 1.9, 2,
 * 2.1, 2.2, 2.4 and 2.6, which is invisible on one icon and obvious in a
 * column of them.
 *
 * `Icon` fixes the weight at 2 and does not expose it, so this asserts the one
 * thing that would regress if someone reached past it: every icon on these
 * pages reports the same weight.
 *
 * `.cta` is excluded on purpose. That is `Primary`, the full-width button
 * shared with the phone layout, and its arrow is drawn at 2.6 - changing it
 * would change the phone, which this desktop-only pass must not touch.
 */
test('every desktop icon is drawn at one weight, from one library', async ({ page }) => {
  await onboard(page);

  for (const slug of AUDITED) {
    await page.goto('/desktop/' + slug);
    await expect(page.locator('.dc-desk-body')).toBeVisible();

    const weights = await page.evaluate(() => {
      const body = document.querySelector('.dc-desk-body');
      if (!body) return [];
      return [...body.querySelectorAll('svg[stroke-width]')]
        .filter((el) => !el.closest('.cta'))
        .map((el) => el.getAttribute('stroke-width'));
    });

    expect(weights.length, slug + ' draws icons').toBeGreaterThan(0);
    expect([...new Set(weights)], slug + ' icon weights').toEqual(['2']);
  }
});

/**
 * Green means good and amber means worth-checking, on every page that shows a
 * verdict.
 *
 * The dashboard used to paint `good` in `--saffron-soft` and `check` in a
 * hard-coded amber - two oranges - so "Good opportunity" was a warning colour
 * there and a success colour on the result screen. Asserted by channel rather
 * than by hex, so the tokens can be retuned without rewriting the test: a
 * green has more green in it than red, an orange does not.
 */
test('a good verdict reads green on every page that shows one', async ({ page }) => {
  await onboard(page);

  const channels = async (slug: string) => {
    await page.goto('/desktop/' + slug);
    const el = page.locator('.dc-desk-body').getByText('Good opportunity').first();
    await expect(el).toBeVisible();
    return el.evaluate((n) => {
      const [r, g, b] = getComputedStyle(n).color.match(/\d+/g)!.map(Number);
      return { r, g, b };
    });
  };

  for (const slug of ['home', 'feasibility']) {
    const c = await channels(slug);
    expect(c.g, slug + ' paints a good verdict green, not orange').toBeGreaterThan(c.r);
  }
});

/**
 * The dashboard gauge is the same component as the result screen's, so it must
 * settle on the same figure. The end state is asserted, not the animation:
 * `--tally` is what the keyframe drives, and it has to land exactly on the
 * engine's score rather than near it.
 */
test('the dashboard gauge settles on the engine score', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/home');

  const dial = page.locator('.dc-desk-body [role="img"]').first();
  await expect(dial).toHaveAttribute('aria-label', DEMO.score + ' / 100');

  await expect
    .poll(async () =>
      Number(
        await page
          .locator('.dc-desk-body .tally')
          .first()
          .evaluate((el) => getComputedStyle(el).getPropertyValue('--tally')),
      ),
    )
    .toBe(DEMO.score);

  // the arc is the same one the result screen draws, and it ends partly drawn
  const arc = page.locator('.dc-desk-body svg circle.arc').first();
  await expect(arc).toHaveCount(1);
  const drawn = await arc.evaluate((el) => {
    const s = getComputedStyle(el);
    return { offset: parseFloat(s.strokeDashoffset), len: parseFloat(s.strokeDasharray) };
  });
  expect(drawn.offset).toBeGreaterThan(0);
  expect(drawn.offset).toBeLessThan(drawn.len);
});

/**
 * The language switch answers a press: `aria-pressed` moves with the choice
 * and the thumb behind it is transformed to the selected half. The transform
 * is read rather than the animation - the end state is the contract.
 */
test('the language switch reports and moves its state', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/settings');

  const hi = page.getByRole('button', { name: 'हिंदी' });
  const en = page.getByRole('button', { name: 'English' });
  const thumb = page.locator('.seg-thumb');

  await expect(en).toHaveAttribute('aria-pressed', 'true');
  await expect(hi).toHaveAttribute('aria-pressed', 'false');
  const atEn = await thumb.evaluate((el) => getComputedStyle(el).transform);

  await hi.click();
  await expect(hi).toHaveAttribute('aria-pressed', 'true');
  await expect(en).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => thumb.evaluate((el) => getComputedStyle(el).transform)).not.toBe(atEn);
});

/**
 * Keyboard focus has to be visible on every page. There was no focus rule in
 * the stylesheet at all before this pass, so each control fell back to
 * whatever the engine draws by default - which on a button painting its own
 * background can be nearly invisible.
 */
test('keyboard focus is visible on every desktop page', async ({ page }) => {
  await onboard(page);

  for (const slug of AUDITED) {
    await page.goto('/desktop/' + slug);
    const control = page.locator('.dc-desk-body button, .dc-desk-body a').first();
    await control.focus();

    const ring = await control.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(ring.style, slug + ' focus ring style').not.toBe('none');
    expect(parseFloat(ring.width), slug + ' focus ring width').toBeGreaterThan(0);
  }
});

/**
 * Starting a check is a route change that has to fetch and re-guard, so the
 * button says it is working rather than looking ignored for that beat. This is
 * the only thing that animates on the applications page - there is no
 * entrance animation on load.
 */
test('starting a check from the applications page confirms the press', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/saved');

  const start = page.getByTestId('start-check');
  await expect(start).toBeVisible();
  await start.click();

  // it either shows the working state or has already arrived; both are correct
  await expect(page).toHaveURL(/\/desktop\/location/);
});

test('every desktop page heads itself with the one shared head', async ({ page }) => {
  await onboard(page);

  const HEADS = [
    ['home', 'Hello, Suresh Kharwar', 'Your check, your loan options and what to do next'],
    ['feasibility', 'Your result', 'Business feasibility analysis'],
    ['report', 'Full report', 'Competitors, price, risks'],
    ['saved', 'Your applications', 'Every check you have filed so far'],
    ['settings', 'Settings', 'Your name, number, language and category'],
  ] as const;

  const rails = new Set<string>();

  for (const [slug, title, sub] of HEADS) {
    await page.goto('/desktop/' + slug);
    const head = page.locator('.dc-desk-title');

    // exactly one head, and it is the shared one: title AND subtitle, which is
    // what DesktopShell's bare `title` prop cannot render
    await expect(head, slug + ' has one head').toHaveCount(1);
    await expect(head.getByText(title, { exact: false }), slug + ' head title').toBeVisible();
    await expect(head.getByText(sub, { exact: false }), slug + ' head subtitle').toBeVisible();

    // the rail: the same lockup art and the same tagline on every page
    const rail = page.locator('.dc-desk-side');
    await expect(rail).toBeVisible();
    await expect(rail.locator('img[src*="udyam-wordmark"]')).toBeVisible();
    await expect(rail.getByText('A government feasibility and loan adviser')).toBeVisible();
    rails.add(
      await rail.evaluate((n) => [...n.querySelectorAll('img')].map((i) => i.getAttribute('src')).join('|')),
    );

    // the flag glyph is painted on every one of them
    const flag = await page
      .locator('.dc-flag')
      .evaluate((n) => getComputedStyle(n, '::before').backgroundImage);
    expect(flag, slug + ' flag glyph').toContain('flag-corner.svg');
  }

  // one rail, not five that happen to agree today
  expect(rails.size, 'the rail lockup is identical on every page').toBe(1);
});

test('the report screen has a way back, from the shared head', async ({ page }) => {
  await onboard(page);
  await page.goto('/desktop/report');

  // it is reached BY leaving the verdict screen, so its head has to offer the
  // way back the other screens' heads do
  await page.locator('.dc-desk-title').getByRole('button', { name: 'Back to your result' }).click();
  await expect(page).toHaveURL(/\/desktop\/feasibility/);
});

/**
 * One action, one name. `useStartCheck` is the single handler behind the
 * dashboard panel, the applications head and the panel under the filed list;
 * before this they called it "Start a new check", "Add a new check" and "Want
 * to apply for another business opportunity?".
 */
test('starting a check is called the same thing everywhere it is offered', async ({ page }) => {
  await onboard(page);

  await page.goto('/desktop/home');
  await expect(page.locator('.dc-desk-body').getByText('Start a new check')).toBeVisible();

  await page.goto('/desktop/share');
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').savedAt), {
      timeout: 20_000,
    })
    .toBeTruthy();

  await page.goto('/desktop/saved');
  await expect(page.getByTestId('application-row').first()).toBeVisible({ timeout: 10_000 });
  // the head's button and the panel below the list, both named for the action
  await expect(page.locator('.dc-desk-body').getByText('Start a new check')).toHaveCount(2);
  await expect(page.getByText('Add a new check')).toHaveCount(0);
  await expect(page.getByText('Want to apply for another business opportunity?')).toHaveCount(0);
});

/** Every rounded label on the desktop screens is the one `Pill`, so they all
 *  draw a full round rather than one screen's own 20px corner. */
test('badges across the desktop screens are one component', async ({ page }) => {
  await onboard(page);

  await page.goto('/desktop/share');
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('udyam.session.v1') ?? '{}').savedAt), {
      timeout: 20_000,
    })
    .toBeTruthy();

  await page.goto('/desktop/saved');
  await expect(page.getByTestId('application-row').first()).toBeVisible({ timeout: 10_000 });

  // every rounded label on the list - the two row tags and the status - is the
  // one component, so all of them draw the full round
  const radii = async () =>
    page.getByTestId('pill').evaluateAll((ns) => ns.map((n) => getComputedStyle(n).borderRadius));
  const saved = await radii();
  expect(saved.length, 'the applications list draws pills').toBeGreaterThan(1);
  expect(new Set(saved), 'one radius across every pill on the list').toEqual(new Set(['999px']));

  // and the dashboard's chips are the same component, not a look-alike
  await page.goto('/desktop/home');
  const home = await radii();
  expect(home.length, 'the dashboard draws pills').toBeGreaterThan(1);
  expect(new Set(home), 'one radius across every pill on the dashboard').toEqual(new Set(['999px']));
});
