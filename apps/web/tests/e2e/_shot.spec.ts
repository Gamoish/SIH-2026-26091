import { test, type Page } from '@playwright/test';

const screen = (p: Page) => p.locator('.dc-phone');

test('shots', async ({ page }) => {
  await page.goto('/');
  await screen(page).getByRole('button', { name: 'English' }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  for (const [i, d] of [...'1234'].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder(/e\.g\./).fill('Suresh Kharwar');
  await page.getByRole('button', { name: /Scheduled Tribe/ }).click();
  await page.getByRole('button', { name: /Next · your location/ }).click();
  await page.getByRole('button', { name: /^Jarha/ }).click();
  await page.getByRole('button', { name: '10 km', exact: true }).click();
  await page.getByRole('button', { name: /Next · enter capital/ }).click();
  await page.getByLabel('Your own capital, in rupees').fill('22000');
  await page.getByRole('button', { name: /Next · choose business/ }).click();
  await page.getByRole('button', { name: 'Leaf plates', exact: true }).click();
  await page.getByRole('button', { name: /Next · see the report/ }).click();
  await page.waitForURL(/feasibility/, { timeout: 15_000 });

  await page.goto('/screens/saved');
  await page.screenshot({ path: 'shots/saved.png' });
  await page.goto('/screens/home');
  await page.screenshot({ path: 'shots/home.png' });
});
