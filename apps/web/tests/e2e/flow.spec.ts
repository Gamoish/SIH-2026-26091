import { test, expect, type Page } from '@playwright/test';

const OTP = '1234';

const screen = (p: Page) => p.locator('.dc-phone');
const pill = (p: Page) => p.locator('body > div').last();

async function onboard(
  page: Page,
  opts: { phone?: string; name?: string; social?: string; village?: string; radius?: string; capital?: string; business?: string } = {},
) {
  const {
    phone = '9876543210', name = 'Suresh Kharwar', social = 'Scheduled Tribe',
    village = 'Jarha', radius = '10 km', capital = '22000', business = 'Leaf plates',
  } = opts;

  await page.goto('/');
  await screen(page).getByRole('button', { name: 'English' }).click();

  await expect(page).toHaveURL(/\/screens\/phone/);
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();

  await expect(page).toHaveURL(/\/screens\/otp/);
  await page.getByLabel('Digit 1').fill(OTP[0]);
  await page.getByLabel('Digit 2').fill(OTP[1]);
  await page.getByLabel('Digit 3').fill(OTP[2]);
  await page.getByLabel('Digit 4').fill(OTP[3]);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/screens\/social/);
  await page.getByPlaceholder(/e\.g\./).fill(name);
  await page.getByRole('button', { name: new RegExp(social) }).click();
  await page.getByRole('button', { name: /Next · your location/ }).click();

  await expect(page).toHaveURL(/\/screens\/location/);
  await page.getByRole('button', { name: new RegExp(`^${village}`) }).click();
  await page.getByRole('button', { name: radius, exact: true }).click();
  await page.getByRole('button', { name: /Next · enter capital/ }).click();

  await expect(page).toHaveURL(/\/screens\/capital/);
  for (const d of capital) await page.getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: /Next · choose business/ }).click();

  await expect(page).toHaveURL(/\/screens\/category/);
  await page.getByRole('button', { name: business, exact: true }).click();
  await page.getByRole('button', { name: /Next · see the report/ }).click();

  await expect(page).toHaveURL(/\/screens\/feasibility/, { timeout: 15_000 });
}

test('a first-time user reaches a report and a repayment plan', async ({ page }) => {
  await onboard(page);

  await expect(page.getByText('Leaf plates · Jarha')).toBeVisible();
  await expect(page.getByText(/people within 10 km/)).toBeVisible();

  await page.getByRole('button', { name: /Full report/ }).click();
  await expect(page).toHaveURL(/\/screens\/report/);
  await expect(page.getByText(/Business case/)).toBeVisible();

  await page.getByRole('button', { name: /the money path/ }).click();
  await expect(page).toHaveURL(/\/screens\/scheme/);

  await expect(page.getByText('NSTFDC Term Loan')).toBeVisible();
  await expect(page.getByText('₹2,20,000')).toBeVisible();
  await expect(page.getByText('+₹1,98,000')).toBeVisible();

  await page.getByRole('button', { name: /repayment plan/ }).click();
  await expect(page).toHaveURL(/\/screens\/emi/);
  await expect(page.getByText('From month 7 · 42 instalments')).toBeVisible();
  await expect(page.getByText('Nothing')).toBeVisible();

  await page.getByRole('button', { name: /show to the bank/ }).click();
  await expect(page).toHaveURL(/\/screens\/share/);
  await expect(page.getByText('Suresh Kharwar (ST)')).toBeVisible();
  await expect(page.getByText('Feasibility & Loan Summary')).toBeVisible();
});

test('the numbers follow the input rather than a fixed demo case', async ({ page }) => {
  await onboard(page, { social: 'Scheduled Caste', capital: '11000', business: 'Tailoring', village: 'Myorpur', radius: '5 km' });

  await page.goto('/screens/scheme');
  await expect(page.getByText('NSFDC Term Loan')).toBeVisible();
  await expect(page.getByText('₹1,10,000')).toBeVisible();
  await expect(page.getByText('₹2,20,000')).toHaveCount(0);
});

test('an unconfirmed scheme shows a gap instead of an invented EMI', async ({ page }) => {
  await onboard(page, { social: 'Other Backward Class' });

  await page.goto('/screens/scheme');
  await expect(page.getByText('Figures pending')).toBeVisible();
  await expect(page.getByText(/not yet confirmed/)).toBeVisible();
  await expect(page.getByText(/₹\d/)).toHaveCount(0);
});

test('a wrong OTP is a real, recoverable state', async ({ page }) => {
  await page.goto('/');
  await screen(page).getByRole('button', { name: 'English' }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();

  for (const [i, d] of [...'9999'].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('That code is wrong — try again')).toBeVisible();
  await expect(page).toHaveURL(/\/screens\/otp/);

  for (const [i, d] of [...OTP].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/screens\/social/);
});

test('phone validation blocks a bad number', async ({ page }) => {
  await page.goto('/');
  await screen(page).getByRole('button', { name: 'English' }).click();

  await page.getByLabel('Mobile number').fill('12345');
  await expect(page.getByRole('button', { name: 'Send OTP' })).toBeDisabled();
  await expect(page.getByText(/10-digit number starting 6–9/)).toBeVisible();

  await page.getByLabel('Mobile number').fill('9876543210');
  await expect(page.getByRole('button', { name: 'Send OTP' })).toBeEnabled();
});

test('deep-linking past onboarding redirects to the missing step', async ({ page }) => {
  await page.goto('/screens/scheme');
  await expect(page).toHaveURL(/\/screens\/language/);
});

test('language persists across navigation and reload', async ({ page }) => {
  await page.goto('/');
  await screen(page).getByRole('button', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/screens\/phone/);
  await expect(page.getByText('Enter your mobile number')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Enter your mobile number')).toBeVisible();

  await pill(page).getByRole('button', { name: 'हिंदी' }).click();
  await expect(page.getByText('अपना मोबाइल नंबर डालिए')).toBeVisible();
});

test('browser back and forward move between real routes', async ({ page }) => {
  await onboard(page);

  await page.getByRole('button', { name: /Full report/ }).click();
  await expect(page).toHaveURL(/\/screens\/report/);

  await page.goBack();
  await expect(page).toHaveURL(/\/screens\/feasibility/);
  await page.goForward();
  await expect(page).toHaveURL(/\/screens\/report/);
});

test('once home, back never re-enters onboarding', async ({ page }) => {
  await onboard(page);

  await page.goto('/screens/share');
  await page.getByRole('button', { name: 'Go to home' }).click();
  await expect(page).toHaveURL(/\/screens\/home/);

  const onboarding = /\/screens\/(phone|otp|location|capital|category|loading)/;
  for (let i = 0; i < 10; i++) {
    await page.goBack();
    await expect(page).not.toHaveURL(onboarding);
  }
});

test('a finished onboarding step redirects home if opened directly', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/share');
  await page.getByRole('button', { name: 'Go to home' }).click();
  await expect(page).toHaveURL(/\/screens\/home/);

  for (const step of ['phone', 'otp', 'location', 'capital', 'category', 'loading']) {
    await page.goto(`/screens/${step}`);
    await expect(page).toHaveURL(/\/screens\/home/);
  }
});

test('starting a new check reopens the onboarding steps', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/share');
  await page.getByRole('button', { name: 'Go to home' }).click();

  await page.getByRole('button', { name: /Start a new check/ }).click();
  await expect(page).toHaveURL(/\/screens\/location/);

  await page.getByRole('button', { name: /^Bijpur/ }).click();
  await page.getByRole('button', { name: /Next · enter capital/ }).click();
  await expect(page).toHaveURL(/\/screens\/capital/);
});

test('the bottom dock switches sections', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/home');

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/screens\/settings/);

  await page.getByRole('button', { name: 'Apps' }).click();
  await expect(page).toHaveURL(/\/screens\/saved/);

  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/screens\/home/);
});

test('no fake phone chrome anywhere', async ({ page }) => {
  await onboard(page);
  for (const path of ['feasibility', 'report', 'scheme', 'emi', 'share', 'home', 'settings']) {
    await page.goto(`/screens/${path}`);
    await expect(page.getByText('9:41')).toHaveCount(0);
  }
});
