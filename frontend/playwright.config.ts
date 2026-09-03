import { defineConfig, devices } from '@playwright/test';

// The suite talks to the same database the API does, and that is now Supabase -
// there is no local Postgres to fall back to. backend/.env.local is the one
// place its URL lives, so read it here rather than duplicating the string.
try {
  process.loadEnvFile('../backend/.env.local');
} catch {
  // absent in CI, where DATABASE_URL is set in the environment instead
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required: copy .env.example to backend/.env.local.');
}

/** Mirrors LAYOUT_COOKIE in src/lib/layout.ts. */
const layoutCookie = (value: 'phone' | 'desktop') => ({
  name: 'udyam.layout',
  value,
  domain: 'localhost',
  path: '/',
  expires: -1,
  httpOnly: false,
  secure: false,
  sameSite: 'Lax' as const,
});

export default defineConfig({
  testDir: './tests/e2e',
  /**
   * Deletes the accounts this run created. The suite signs up through the real
   * OTP flow, so without this every run leaves users, profiles, applications
   * and OTP rows behind permanently. See tests/e2e/teardown.ts.
   */
  globalTeardown: './tests/e2e/teardown.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3111',
    trace: 'retain-on-failure',
  },
  /**
   * Each project seeds the layout cookie its device should resolve to.
   *
   * `middleware.ts` routes on that cookie ahead of the user-agent, so seeding
   * it pins each project to one tree: without it the desktop project's
   * `/screens/*` navigations would all be redirected to `/desktop/*` and every
   * phone-layout assertion would fail. Seeding is also what the real
   * reconciler does on first load, so this is the settled state, not a bypass.
   */
  projects: [
    {
      name: 'phone',
      testMatch: /flow\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        storageState: { cookies: [layoutCookie('phone')], origins: [] },
      },
    },
    {
      name: 'desktop',
      testMatch: /(desktop|canvas-layout)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [layoutCookie('desktop')], origins: [] },
      },
    },
    {
      // Deliberately no seeded cookie: this project exercises the automatic
      // routing itself, which only runs when nothing has been chosen yet.
      name: 'routing',
      testMatch: /routing\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // The real API. Auth is server-side now, so the suite needs it running.
      // Requires a migrated database: `pnpm api:migrate`.
      command: 'node --experimental-strip-types ../backend/src/server.ts',
      url: 'http://localhost:4001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        API_PORT: '4001',
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
        OTP_DEV_MODE: 'true',
        // returns the code in the response; env.ts refuses this in production
        OTP_DEV_ECHO: 'true',
        CORS_ORIGIN: 'http://localhost:3111',
      },
    },
    {
      command: 'npx next build && npx next start -p 3111',
      url: 'http://localhost:3111',
      // Build into a directory of its own. Sharing `.next` with `next dev` leaves
      // the dev server holding a production runtime plus dev chunks, which fails
      // at request time with "Cannot find module './<id>.js'". next.config.ts
      // already reads NEXT_DIST_DIR; this is the half that was missing.
      env: {
        NEXT_DIST_DIR: '.next-e2e',
        NEXT_PUBLIC_API_URL: 'http://localhost:4001',
        // the LGD table is empty until an official export is imported, so the
        // suite runs against the clearly-labelled demo fixtures
        NEXT_PUBLIC_DEMO_VILLAGES: 'true',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
