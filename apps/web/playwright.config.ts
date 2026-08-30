import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3111',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx next build && npx next start -p 3111',
    url: 'http://localhost:3111',
    // Build into a directory of its own. Sharing `.next` with `next dev` leaves
    // the dev server holding a production runtime plus dev chunks, which fails
    // at request time with "Cannot find module './<id>.js'". next.config.ts
    // already reads NEXT_DIST_DIR; this is the half that was missing.
    env: { NEXT_DIST_DIR: '.next-e2e' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
