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
  expect(await page.locator('.dc-desk-body').innerText()).toContain(DEMO.emi);

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
