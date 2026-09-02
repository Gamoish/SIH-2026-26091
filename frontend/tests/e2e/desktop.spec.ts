import { test, expect, type Page } from '@playwright/test';

/**
 * The desktop tree, end to end. Runs under the `desktop` project, which seeds
 * `disha.layout=desktop` so middleware keeps every navigation on `/desktop/*`.
 *
 * The phone flow is covered by flow.spec.ts; this is the same journey through
 * the other layout, so a screen that renders only on one of the two cannot
 * ship unnoticed.
 */

const API = 'http://localhost:4001';

/** A fresh number per test, so parallel workers never share an OTP bucket. */
const nextPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

async function currentCode(page: Page, phone: string): Promise<string> {
  const res = await page.request.post(`${API}/api/auth/request-otp`, { data: { phone_number: phone } });
  return (await res.json()).MOCK_dev_code as string;
}

async function onboard(page: Page, phone = nextPhone()) {
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
  await page.getByRole('button', { name: /Scheduled Tribe/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/desktop\/location/);
  await page
    .getByRole('option', { name: /^Jarha/ })
    .first()
    .click();
  await page.getByRole('button', { name: '10 km', exact: false }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/desktop\/capital/);
  await page.getByLabel(/Your capital/).fill('22000');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/desktop\/category/);
  await page.getByRole('button', { name: 'Leaf plates', exact: true }).click();
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
  // planLoan()'s own figures for a 22,000 ST case
  expect(body).toContain('₹5,395');
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
  const phone = await page.evaluate(() => JSON.parse(localStorage.getItem('disha.session.v1') ?? '{}').phone);
  await expect(page.getByText(`+91 ${phone}`).first()).toBeVisible();

  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('disha.session.v1') ?? '{}').photo,
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
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('disha.session.v1') ?? '{}').photo))
    .toMatch(/^data:image\/jpeg;base64,/);

  // and it is the same photo on the phone layout - one session, one field
  await page.goto('/screens/settings');
  await expect(page.locator('img[alt=""]').first()).toBeVisible();
});

test('finishing a case files it to the database, and the list reads it back', async ({ page }) => {
  await onboard(page);

  // the share sheet is what files the case
  await page.goto('/desktop/share');
  await expect(page.getByText('Feasibility summary')).toBeVisible();

  // The list screen fetches GET /api/applications, so a row appearing here is
  // proof the case reached Postgres - the session alone could not produce it.
  await page.goto('/desktop/saved');
  await expect(page.getByText('Leaf plates')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('/ 100')).toBeVisible();

  // and it survives this browser forgetting the case entirely
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('disha.session.v1') ?? '{}');
    localStorage.setItem(
      'disha.session.v1',
      JSON.stringify({ ...s, business: null, savedAt: null, capital: null }),
    );
  });
  await page.goto('/desktop/saved');
  await expect(page.getByText('Leaf plates')).toBeVisible();
});
