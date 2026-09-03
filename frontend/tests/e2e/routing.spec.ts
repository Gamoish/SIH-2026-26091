import { test, expect } from '@playwright/test';

/**
 * Automatic layout routing: middleware picks a tree from the cookie, falling
 * back to the user-agent, and the client corrects the guess against the real
 * viewport once per load.
 *
 * This project seeds no cookie - that is the point. Every other project pins
 * its tree, so this is the only place the detection itself is exercised.
 */

const LAYOUT_COOKIE = 'udyam.layout';

const cookieValue = async (page: import('@playwright/test').Page) =>
  (await page.context().cookies()).find((c) => c.name === LAYOUT_COOKIE)?.value;

test('a desktop viewport lands on the desktop tree and is remembered', async ({ page }) => {
  await page.goto('/screens/language');
  await expect(page).toHaveURL(/\/desktop\/language/);
  await expect(page.locator('.dc-onb')).toBeVisible();
  expect(await cookieValue(page)).toBe('desktop');
});

test('a narrow viewport is corrected to the phone tree, and stays there', async ({ page }) => {
  // A desktop user-agent with a phone-sized window: middleware guesses desktop,
  // the reconciler disagrees and writes the cookie.
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto('/desktop/language');

  await expect(page).toHaveURL(/\/screens\/language/);
  await expect(page.locator('.dc-phone')).toBeVisible();
  expect(await cookieValue(page)).toBe('phone');

  // The correction must survive: asking for the desktop tree again now hits the
  // cookie, not the user-agent, and comes back. A redirect loop would time out
  // here rather than settling.
  await page.goto('/desktop/phone');
  await expect(page).toHaveURL(/\/screens\/phone/);
  await expect(page.locator('.dc-phone')).toBeVisible();
});

test('no redirect loop: a settled visitor stays put across navigations', async ({ page }) => {
  await page.goto('/screens/language');
  await expect(page).toHaveURL(/\/desktop\/language/);

  for (const slug of ['phone', 'language', 'phone']) {
    await page.goto(`/desktop/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/desktop/${slug}`));
  }
});

test('the entry route resolves a layout as well as a step', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/desktop\/language/);
  expect(await cookieValue(page)).toBe('desktop');
});

test('mobile-only screens are left alone on a desktop client', async ({ page }) => {
  // There is no desktop counterpart for these, so redirecting would be a dead
  // end. They render in the phone layout, which is what desktop Settings links
  // to on purpose.
  //
  // The session is seeded because these screens are behind `isOnboarded`:
  // without it the guard sends the visitor to `language` and the test proves
  // nothing about the mobile-only rule. It used to accept `/screens/language`
  // as a pass, which quietly allowed a desktop visitor to be dropped into the
  // phone tree - see the filing test below.
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
        capital: 22000,
        business: 'leaf-plates',
        savedAt: null,
      }),
    );
  });

  for (const slug of ['edit-photo', 'edit-category']) {
    await page.goto(`/screens/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/screens/${slug}$`));
    await expect(page.locator('.dc-phone')).toBeVisible();
  }
});

test('an explicit choice outranks the user-agent', async ({ page, context }) => {
  await context.addCookies([
    {
      name: LAYOUT_COOKIE,
      value: 'phone',
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Desktop user-agent, desktop-sized window, but the visitor chose phone.
  await page.goto('/desktop/language');
  await expect(page).toHaveURL(/\/screens\/language/);
  await expect(page.locator('.dc-phone')).toBeVisible();
});

test('a mobile-only screen does not file a desktop visitor as a phone user', async ({ page }) => {
  // `targetFor` returns null for two different reasons - already in the right
  // tree, and "this slug has no twin in your tree" - and the reconciler used to
  // record the tree it was standing in rather than what the viewport said. A
  // desktop visitor whose first URL was an edit screen was filed as a phone
  // user for a year, with every later navigation sent to the phone tree.
  await page.goto('/screens/edit-photo');
  // the reconciler writes the cookie from an effect, so this has to be polled -
  // reading once after `goto` races hydration
  await expect.poll(() => cookieValue(page)).toBe('desktop');

  // the next ordinary navigation must therefore go back to the desktop tree
  await page.goto('/screens/language');
  await expect(page).toHaveURL(/\/desktop\/language/);
});

test('the hop to the phone layout is reversible', async ({ page }) => {
  // Desktop Settings links into the phone tree for the edits it has no screen
  // for, and that link writes the phone preference so middleware stops bouncing
  // the visitor back. Nothing wrote it the other way, so it was a one-way door.
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
        capital: 22000,
        business: 'leaf-plates',
        savedAt: null,
      }),
    );
  });

  await page.goto('/desktop/settings');
  await page.getByRole('link', { name: /Change name/ }).click();
  await expect(page).toHaveURL(/\/screens\/settings/);
  expect(await cookieValue(page)).toBe('phone');

  await page.getByRole('button', { name: /Back to the desktop view/ }).click();
  await expect(page).toHaveURL(/\/desktop\/settings/);
  expect(await cookieValue(page)).toBe('desktop');
});
