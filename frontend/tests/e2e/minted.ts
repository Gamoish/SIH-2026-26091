import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every phone number the suite mints, recorded so globalTeardown can delete
 * exactly those accounts afterwards.
 *
 * The file lives at the package root rather than under `test-results/`, on
 * purpose: Playwright wipes its output directory at the start of every run, so
 * a list kept there would be destroyed before a crashed run's leftovers could
 * be cleaned up. Here the list survives a crash and the next run's teardown
 * sweeps both.
 *
 * Recorded at mint time, not at test end - a test that fails midway has still
 * created the account, and that is precisely the one worth cleaning.
 */
/**
 * Resolved from the working directory, not from import.meta.url: Playwright
 * transpiles specs and the global hooks to CommonJS, where import.meta is a
 * syntax error. Both the specs and the teardown resolve it the same way and
 * run in the same process tree, so they always agree on the path.
 */
export const MINTED_FILE = join(process.cwd(), '.e2e-minted');

/**
 * A fresh number per call, so parallel workers never share an OTP bucket.
 *
 * appendFileSync opens with O_APPEND, so the interleaved writes from Playwright's
 * separate worker processes each land as a whole line instead of overwriting one
 * another. The writes are small and line-terminated, which is what keeps that
 * true in practice.
 */
export function nextPhone(): string {
  const phone = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
  appendFileSync(MINTED_FILE, `${phone}\n`);
  return phone;
}
