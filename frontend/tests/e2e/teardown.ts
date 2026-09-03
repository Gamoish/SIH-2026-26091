import { readFileSync, rmSync } from 'node:fs';
import { Client } from 'pg';
import { MINTED_FILE } from './minted';

/**
 * Delete the accounts this run created.
 *
 * The suite signs up through the real OTP flow, so every run leaves users,
 * onboarding_profiles, applications and otp_codes behind. With no teardown the
 * table grew on every run - 124 users and 42 applications had accumulated
 * before this existed.
 *
 * Deletes by the exact numbers recorded in .e2e-minted rather than by a
 * timestamp window or a phone-number prefix. A window would sweep up rows a
 * developer was looking at; this only ever removes what the suite itself made.
 *
 * Goes at the database rather than through the API because there are no DELETE
 * routes, by design - nothing in the product deletes an account.
 */
async function globalTeardown() {
  let numbers: string[];
  try {
    numbers = [
      ...new Set(
        readFileSync(MINTED_FILE, 'utf8')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      ),
    ];
  } catch {
    // No file: a run that minted nothing - a single test file that only seeds
    // localStorage, say. Nothing to do, and not an error.
    return;
  }

  if (numbers.length === 0) {
    rmSync(MINTED_FILE, { force: true });
    return;
  }

  // Stored in E.164; minted as a bare 10-digit number.
  const e164 = numbers.map((n) => `+91${n}`);

  // playwright.config.ts loads backend/.env.local and fails fast if this is unset.
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    // One transaction, so a failure partway cannot leave half a run behind.
    // onboarding_profiles and applications cascade from users; otp_codes is
    // keyed by phone number, not user_id, so it has to be named explicitly.
    await client.query('BEGIN');
    const otp = await client.query('DELETE FROM otp_codes WHERE phone_number = ANY($1)', [e164]);
    const users = await client.query('DELETE FROM users WHERE phone_number = ANY($1)', [e164]);
    await client.query('COMMIT');
    console.warn(
      `e2e teardown: removed ${users.rowCount} account(s) and ${otp.rowCount} OTP row(s) from ${numbers.length} minted number(s).`,
    );
    // Only drop the list once the delete has actually committed. If this run
    // could not reach the database the file stays, and the next run's teardown
    // clears both.
    rmSync(MINTED_FILE, { force: true });
  } catch (err) {
    // Loud, and fatal. A silent teardown failure is how the pile grew in the
    // first place; the run's own results have already been reported by now.
    console.error('e2e teardown FAILED - test accounts were left behind:', err);
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

export default globalTeardown;
