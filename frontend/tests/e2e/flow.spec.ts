import { test, expect, type Page } from '@playwright/test';

const API = 'http://localhost:4001';

/**
 * A fresh number per test, so parallel workers never share an account or an OTP
 * throttle bucket. Randomised rather than sequential: workers are separate
 * processes with their own module state, so any counter-based scheme collides.
 */
const nextPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

/** Read the current code for a number. OTP_DEV_ECHO returns it; production refuses that flag. */
async function currentCode(page: Page, phone: string): Promise<string> {
  const res = await page.request.post(`${API}/api/auth/request-otp`, { data: { phone_number: phone } });
  const body = await res.json();
  return body.MOCK_dev_code as string;
}

const screen = (p: Page) => p.locator('.dc-phone');

async function onboard(
  page: Page,
  opts: {
    phone?: string;
    name?: string;
    social?: string;
    village?: string;
    radius?: string;
    capital?: string;
    business?: string;
  } = {},
) {
  const {
    phone = nextPhone(),
    name = 'Suresh Kharwar',
    social = 'Scheduled Tribe',
    village = 'Jarha',
    radius = '10 km',
    capital = '22000',
    business = 'Leaf plates',
  } = opts;

  await page.goto('/');
  // Retry the very first tap: under parallel load the button can be painted
  // before React has hydrated, and that first click is simply dropped.
  await expect(async () => {
    // idempotent: once the click lands the button is gone, so only click while
    // the language screen is actually still on screen
    const english = screen(page).getByRole('button', { name: 'English' });
    if (await english.count()) await english.click({ timeout: 2000 }).catch(() => {});
    await expect(page).toHaveURL(/\/screens\/phone/, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();

  await expect(page).toHaveURL(/\/screens\/otp/);
  // The code is random and server-side; read the live one for this number.
  const code = await currentCode(page, phone);
  for (const [i, d] of [...code].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
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
  await page.getByLabel('Your own capital, in rupees').fill(capital);
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
  await onboard(page, {
    social: 'Scheduled Caste',
    capital: '11000',
    business: 'Tailoring',
    village: 'Myorpur',
    radius: '5 km',
  });

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
  const phone = nextPhone();
  await page.goto('/');
  await expect(async () => {
    // idempotent: once the click lands the button is gone, so only click while
    // the language screen is actually still on screen
    const english = screen(page).getByRole('button', { name: 'English' });
    if (await english.count()) await english.click({ timeout: 2000 }).catch(() => {});
    await expect(page).toHaveURL(/\/screens\/phone/, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page).toHaveURL(/\/screens\/otp/);

  const code = await currentCode(page, phone);
  const wrong = code === '0000' ? '1111' : '0000';
  for (const [i, d] of [...wrong].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();

  // the server counts the attempt down, so the message names what is left
  await expect(page.getByText(/That code is wrong/)).toBeVisible();
  await expect(page).toHaveURL(/\/screens\/otp/);

  for (const [i, d] of [...code].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/screens\/social/);
});

test('five wrong codes burn the code and require a resend', async ({ page }) => {
  const phone = nextPhone();
  await page.goto('/');
  await expect(async () => {
    // idempotent: once the click lands the button is gone, so only click while
    // the language screen is actually still on screen
    const english = screen(page).getByRole('button', { name: 'English' });
    if (await english.count()) await english.click({ timeout: 2000 }).catch(() => {});
    await expect(page).toHaveURL(/\/screens\/phone/, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page).toHaveURL(/\/screens\/otp/);

  const code = await currentCode(page, phone);
  const wrong = code === '0000' ? '1111' : '0000';
  for (let attempt = 0; attempt < 5; attempt++) {
    for (const [i, d] of [...wrong].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/wrong|Too many/)).toBeVisible();
  }
  // the correct code no longer works once the cap is burnt
  for (const [i, d] of [...code].entries()) await page.getByLabel(`Digit ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/Too many wrong codes/)).toBeVisible();
  await expect(page).toHaveURL(/\/screens\/otp/);
});

test('phone validation blocks a bad number', async ({ page }) => {
  await page.goto('/');
  await screen(page).getByRole('button', { name: 'English' }).click();

  await page.getByLabel('Mobile number').fill('12345');
  await expect(page.getByRole('button', { name: 'Send OTP' })).toBeDisabled();
  await expect(page.getByText(/10-digit number starting 6–9/)).toBeVisible();

  await page.getByLabel('Mobile number').fill(nextPhone());
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
});

test('language is changed from Settings once it has been picked', async ({ page }) => {
  await onboard(page);

  // the floating corner toggle is gone from every screen
  for (const slug of FLOW) {
    await page.goto(`/screens/${slug}`);
    await expect(page.getByLabel('हिंदी'), `${slug} still shows the corner toggle`).toHaveCount(0);
    await expect(page.getByLabel('English'), `${slug} still shows the corner toggle`).toHaveCount(0);
  }

  // ...and Settings is where language now lives
  await page.goto('/screens/settings');
  await page.getByRole('button', { name: 'हिंदी', exact: true }).click();
  await expect(page.getByText('सेटिंग्स').first()).toBeVisible();

  await page.goto('/screens/home');
  await expect(page.getByText('नमस्ते')).toBeVisible();
  await page.reload();
  await expect(page.getByText('नमस्ते')).toBeVisible();
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

  for (const step of ['language', 'phone', 'otp', 'social', 'location', 'capital', 'category', 'loading']) {
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

test('the monument motif is decoration only', async ({ page }) => {
  await page.goto('/screens/language');
  await screen(page).getByRole('button', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/screens\/phone/);

  const frame = page.locator('.dc-phone');
  await frame.waitFor();
  const skyline = await frame.evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    const mask = s.getPropertyValue('mask-image') || s.getPropertyValue('-webkit-mask-image');
    return { mask, opacity: s.opacity, events: s.pointerEvents };
  });
  expect(skyline.mask).toContain('/monuments/');
  expect(Number(skyline.opacity)).toBeGreaterThan(0.05);
  expect(Number(skyline.opacity)).toBeLessThan(0.2);
  expect(skyline.events).toBe('none');

  const tricolor = await frame.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(tricolor).toContain('gradient');

  const flag = await frame.evaluate((el) => {
    const s = getComputedStyle(el.firstElementChild!, '::before');
    return { bg: s.backgroundImage, events: s.pointerEvents };
  });
  expect(flag.bg).toContain('flag-corner.svg');
  expect(flag.events).toBe('none');

  await page.getByLabel('Mobile number').fill(nextPhone());
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page).toHaveURL(/\/screens\/otp/);
});

test('the monument changes from screen to screen', async ({ page }) => {
  await onboard(page);

  const maskOf = async () => {
    const frame = page.locator('.dc-phone');
    await frame.waitFor();
    return frame.evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return s.getPropertyValue('mask-image') || s.getPropertyValue('-webkit-mask-image');
    });
  };

  const seen = new Map<string, string>();
  for (const slug of ['feasibility', 'report', 'swot', 'competitors', 'pricing', 'scheme', 'emi']) {
    await page.goto(`/screens/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/screens/${slug}`));
    const file = (await maskOf()).match(/monuments\/([a-z-]+)\.svg/)?.[1];
    expect(file, `${slug} resolved no monument`).toBeTruthy();
    expect(seen.has(file!), `${slug} reuses ${file} from ${seen.get(file!)}`).toBe(false);
    seen.set(file!, slug);
  }
  expect(seen.size).toBe(7);
});

const FLOW = [
  'language',
  'phone',
  'otp',
  'social',
  'location',
  'capital',
  'category',
  'feasibility',
  'report',
  'swot',
  'competitors',
  'pricing',
  'scheme',
  'emi',
  'share',
  'home',
  'saved',
  'settings',
];

test('the decorations get their own space and shift nothing', async ({ page }) => {
  await onboard(page);

  for (const slug of FLOW) {
    await page.goto(`/screens/${slug}`);
    const frame = page.locator('.dc-phone');
    await frame.waitFor();

    const box = await frame.evaluate((el) => {
      const bar = el.firstElementChild as HTMLElement;
      const cs = getComputedStyle(bar, '::before');
      const r = el.getBoundingClientRect();
      return {
        flagBg: cs.backgroundImage,
        flagW: parseFloat(cs.width),
        flagZ: cs.zIndex,
        flagEvents: cs.pointerEvents,
        padTop: parseFloat(getComputedStyle(el).paddingTop),
        padBottom: parseFloat(getComputedStyle(el).paddingBottom),
        width: r.width,
        // content box: the desktop frame carries a 1px border
        innerLeft: r.left + parseFloat(getComputedStyle(el).borderLeftWidth),
        innerWidth: el.clientWidth,
        top: r.top,
        bottom: r.bottom,
        barTop: bar.getBoundingClientRect().top,
      };
    });

    // 1. the corner flag is on every screen, is corner-sized, sits behind the
    //    bar's own icons, and adds no height: the frame has no top padding and
    //    the top bar still starts flush with the top of the frame.
    expect(box.flagBg, `${slug} has no corner flag`).toContain('flag-corner.svg');
    expect(box.flagW, `${slug}: the flag is not a corner accent`).toBeLessThanOrEqual(96);
    expect(box.flagZ, `${slug}: the flag is painted over the header icons`).toBe('-1');
    expect(box.flagEvents, `${slug}: the flag swallows taps`).toBe('none');
    expect(box.padTop, `${slug}: the flag pushed the header down`).toBe(0);
    expect(box.barTop - box.top, `${slug}: the header was shifted down`).toBeLessThanOrEqual(1);

    // 2. the dock, where a screen has one, is flush with the bottom edge of the
    //    frame - no floating gap - and the skyline band sits above it.
    const edge = box.bottom - box.padBottom;
    const nav = frame.locator(':scope > nav');
    const dock = (await nav.count()) ? await nav.boundingBox() : null;
    if (dock) {
      expect(
        Math.abs(dock.y + dock.height - edge),
        `${slug}: the dock floats off the bottom edge`,
      ).toBeLessThanOrEqual(1);
      expect(dock.x, `${slug}: the dock is inset from the frame edge`).toBeLessThanOrEqual(box.innerLeft + 1);
      expect(dock.width, `${slug}: the dock is not full-bleed`).toBeGreaterThanOrEqual(box.innerWidth - 1);
    }

    // 3. the skyline gets a full-height band of its own at the monument's own
    //    proportions (640x130), and nothing reaches into it from either side.
    const skylineH = box.width / (640 / 130);
    expect(skylineH, `${slug}: the skyline band is a thin strip`).toBeGreaterThan(80);
    const skylineBottom = edge - (dock?.height ?? 0);
    const skylineTop = skylineBottom - skylineH;
    for (const child of await frame.locator(':scope > *:not(nav)').all()) {
      const r = await child.boundingBox();
      if (!r) continue;
      expect(r.y + r.height, `${slug}: content overlaps the skyline`).toBeLessThanOrEqual(skylineTop + 1);
    }
  }
});

test('the capital screen uses the native keyboard, not a drawn keypad', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/capital');

  const amount = page.getByLabel('Your own capital, in rupees');
  await expect(amount).toHaveAttribute('inputmode', 'numeric');
  await amount.fill('22000');
  await expect(page.getByText('₹22,000', { exact: true })).toBeVisible();

  for (const k of ['1', '7', '00', '⌫']) {
    await expect(page.getByRole('button', { name: k, exact: true })).toHaveCount(0);
  }
});

const FIRST_RUN = /\/screens\/(language|phone|otp|social)/;

test('no Settings row can reopen a first-run screen', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/settings');

  // the category row is the one that used to route straight into onboarding
  await page.getByRole('button', { name: /Your category/ }).click();
  await expect(page).toHaveURL(/\/screens\/edit-category/);
  await expect(page).not.toHaveURL(FIRST_RUN);
  await expect(page.getByText('Change your category')).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: /^Photo/ }).click();
  await expect(page).toHaveURL(/\/screens\/edit-photo/);
  await expect(page).not.toHaveURL(FIRST_RUN);
});

test('a first-run screen is unreachable once the account exists', async ({ page }) => {
  await onboard(page);

  for (const slug of ['language', 'phone', 'otp', 'social']) {
    await page.goto(`/screens/${slug}`);
    await expect(page, `${slug} is still reachable when logged in`).toHaveURL(/\/screens\/home/);
  }
});

test('the scheme screen edits the category without reopening onboarding', async ({ page }) => {
  await onboard(page, { social: 'Other Backward Class' });
  await page.goto('/screens/scheme');

  await page.getByRole('button', { name: /Change your category/ }).click();
  await expect(page).toHaveURL(/\/screens\/edit-category/);
  await expect(page).not.toHaveURL(FIRST_RUN);
});

test('name and phone are edited in a sheet, not a screen', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/settings');

  await page.getByRole('button', { name: /^Name/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/screens\/settings/);

  await dialog.getByLabel('Your name').fill('Meena Devi');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Meena Devi')).toBeVisible();

  // the new name reaches the sheet the bank sees
  await page.goto('/screens/share');
  await expect(page.getByText('Meena Devi (ST)')).toBeVisible();
});

test('a phone change is re-verified by OTP inside the sheet', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/settings');

  const newPhone = nextPhone();
  await page.getByRole('button', { name: /Phone number/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('New mobile number').fill(newPhone);
  await dialog.getByRole('button', { name: 'Send OTP' }).click();
  await expect(dialog.getByLabel('OTP code')).toBeVisible();

  // the code is random and server-side, so read the live one for the new number
  const code = await currentCode(page, newPhone);
  const wrong = code === '0000' ? '1111' : '0000';

  await dialog.getByLabel('OTP code').fill(wrong);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByText(/That code is wrong/)).toBeVisible();
  await expect(page).toHaveURL(/\/screens\/settings/);

  await dialog.getByLabel('OTP code').fill(code);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(`+91 ${newPhone}`)).toBeVisible();
});

test('changing the category from Settings moves the scheme', async ({ page }) => {
  await onboard(page);
  await page.goto('/screens/scheme');
  await expect(page.getByText('NSTFDC Term Loan')).toBeVisible();

  await page.goto('/screens/edit-category');
  await page.getByRole('button', { name: /Scheduled Caste/ }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await page.goto('/screens/scheme');
  await expect(page.getByText('NSFDC Term Loan')).toBeVisible();
});

/**
 * A village picked from the real directory has an LGD code and no demo
 * fixture, so `buildReport()` has nothing to work from. It must say so.
 *
 * This regressed once as a permanent shimmer: the effect bailed out early on
 * the missing fixture id, so it neither navigated nor failed and the screen
 * waited for ever.
 */
test('a village with no fixture fails honestly instead of hanging', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'disha.session.v1',
      JSON.stringify({
        lang: 'en',
        name: 'Suresh',
        phone: '9876543210',
        photo: null,
        verified: true,
        social: 'ST',
        village: null,
        villageLgdCode: 'C11-214157',
        villageName: 'Adhavra',
        tehsil: 'Dudhi',
        radiusKm: 5,
        capital: 22000,
        business: 'leaf-plates',
        savedAt: null,
      }),
    );
  });

  await page.goto('/screens/loading');
  await expect(page.getByText(/no figures for this village yet/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Change village/i })).toBeVisible();
});

/**
 * The five interaction transitions degrade under `prefers-reduced-motion`.
 *
 * utilities.css declares none of them per-rule: they rely on the one global
 * block clamping every animation- and transition-duration to 0.01ms. That is
 * only true if the block really does reach them, which is a claim about the
 * cascade, so it is measured rather than read.
 */
test('every transition is clamped under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/screens/language');

  const durations = await page.evaluate(() => {
    const probe = (cls: string, prop: 'animationDuration' | 'transitionDuration') => {
      const el = document.createElement('div');
      el.className = cls;
      document.body.appendChild(el);
      const v = getComputedStyle(el)[prop];
      el.remove();
      return v;
    };
    return {
      press: probe('press', 'transitionDuration'),
      scrim: probe('sheet-scrim', 'animationDuration'),
      panel: probe('sheet-panel', 'animationDuration'),
      reveal: probe('reveal', 'animationDuration'),
      tally: probe('tally', 'animationDuration'),
      step: probe('step-dot', 'transitionDuration'),
    };
  });

  // 0.01ms, however many properties each rule lists. Parsed rather than string
  // matched: the browser serialises it as `1e-05s`.
  for (const [name, value] of Object.entries(durations)) {
    for (const part of value.split(',')) {
      expect(parseFloat(part), `${name} is clamped`).toBeLessThanOrEqual(0.0001);
    }
  }
});

test('the transitions are live when motion is not reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/screens/language');

  const live = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'reveal';
    document.body.appendChild(el);
    const v = getComputedStyle(el).animationDuration;
    el.remove();
    return v;
  });
  expect(parseFloat(live), 'reveal animates normally').toBeGreaterThan(0.05);
});
