import { test, expect } from '@playwright/test';

/**
 * Automatic layout routing: middleware picks a tree from the cookie, falling
 * back to the user-agent, and the client corrects the guess against the real
 * viewport once per load.
 *
 * This project seeds no cookie - that is the point. Every other project pins
 * its tree, so this is the only place the detection itself is exercised.
 */

const LAYOUT_COOKIE = 'disha.layout';

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
  for (const slug of ['edit-photo', 'edit-category']) {
    await page.goto(`/screens/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/screens/${slug}|/screens/language`));
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
