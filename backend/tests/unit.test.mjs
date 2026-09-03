/**
 * Pure-logic checks: phone normalisation, OTP hashing, and the LGD CSV parser.
 * No database and no server - these are the pieces where a quiet bug is a
 * security bug, so they are testable on their own.
 */
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { normalisePhone, maskPhone } from '../src/lib/phone.ts';
import { generateCode, hashCode, verifyCode } from '../src/lib/otp.ts';
import { parseCsv, findColumn, extractVillages } from '../src/lib/lgd-csv.ts';

let n = 0;
const test = async (name, fn) => {
  await fn();
  n++;
  console.log(`  ok  ${name}`);
};

// --- phone -----------------------------------------------------------------

await test('every spelling of one number normalises to a single E.164 form', () => {
  const forms = ['9876543210', '+919876543210', '919876543210', '09876543210', '98765 43210', '+91 98765-43210'];
  for (const f of forms) assert.equal(normalisePhone(f), '+919876543210', `${f} did not normalise`);
});

await test('non-mobile and malformed numbers are rejected, not coerced', () => {
  for (const bad of ['12345', '1234567890', '5876543210', '', 'abcdefghij', '98765432101', '+1 415 555 0100']) {
    assert.equal(normalisePhone(bad), null, `${bad} should be rejected`);
  }
});

await test('a masked number keeps only the last four digits', () => {
  assert.equal(maskPhone('+919876543210'), '+91******3210');
});

// --- otp --------------------------------------------------------------------

await test('generated codes are the requested length and all digits', () => {
  for (let i = 0; i < 50; i++) {
    const c = generateCode(4);
    assert.match(c, /^\d{4}$/);
  }
});

await test('generated codes are not all identical', () => {
  const seen = new Set(Array.from({ length: 200 }, () => generateCode(4)));
  assert.ok(seen.size > 20, `only ${seen.size} distinct codes in 200 draws`);
});

await test('a code verifies against its own hash and nothing else', async () => {
  const hash = await hashCode('1234');
  assert.equal(await verifyCode('1234', hash), true);
  assert.equal(await verifyCode('1235', hash), false);
  assert.equal(await verifyCode('', hash), false);
});

await test('the stored hash is not the code, and is salted per code', async () => {
  const a = await hashCode('1234');
  const b = await hashCode('1234');
  assert.ok(!a.includes('1234'), 'the plaintext code leaked into the stored value');
  assert.notEqual(a, b, 'two hashes of the same code are identical - salt is missing');
  assert.equal(await verifyCode('1234', b), true);
});

await test('a malformed stored hash fails closed', async () => {
  for (const bad of ['', 'garbage', 'scrypt$only-one-part', 'md5$aaaa$bbbb']) {
    assert.equal(await verifyCode('1234', bad), false, `${bad} should not verify`);
  }
});

// --- LGD csv ----------------------------------------------------------------

await test('the CSV parser handles quotes, embedded commas and CRLF', () => {
  const rows = parseCsv('a,b\r\n"x,1","he said ""hi"""\r\n');
  assert.deepEqual(rows, [
    ['a', 'b'],
    ['x,1', 'he said "hi"'],
  ]);
});

await test('column lookup tolerates LGD header spelling drift', () => {
  const headers = ['S.No', 'Village Name (In English)', 'Village Code', 'Sub-District Name'];
  assert.equal(findColumn(headers, ['Village Code', 'LGD Code']), 2);
  assert.equal(findColumn(headers, ['Village Name']), 1);
  assert.equal(findColumn(headers, ['Sub District Name', 'Tehsil']), 3);
  assert.equal(findColumn(headers, ['Nothing Like This']), -1);
});

await test('a title row above the header does not defeat the importer', () => {
  const csv = [
    'Local Government Directory - Village Report',
    'State Name,District Name,Sub-District Name,Village Name,Village Code',
    'Uttar Pradesh,Sonbhadra,Robertsganj,Example One,123456',
    'Uttar Pradesh,Sonbhadra,Ghorawal,Example Two,123457',
  ].join('\n');
  const { records } = extractVillages(csv);
  assert.equal(records.length, 2);
  assert.deepEqual(records[0], { lgdCode: '123456', name: 'Example One', tehsil: 'Robertsganj' });
  assert.equal(records[1].tehsil, 'Ghorawal');
});

await test('rows without a numeric LGD code are skipped, never invented', () => {
  const csv = [
    'Sub-District Name,Village Name,Village Code',
    'Robertsganj,Good Row,123456',
    'Robertsganj,No Code,',
    'Robertsganj,Bad Code,N/A',
    ',Missing Tehsil,123458',
  ].join('\n');
  const { records, skipped } = extractVillages(csv);
  assert.equal(records.length, 1);
  assert.equal(records[0].lgdCode, '123456');
  assert.equal(skipped.length, 3);
});

await test('a duplicate LGD code is kept once', () => {
  const csv = [
    'Sub-District Name,Village Name,Village Code',
    'Dudhi,First,999001',
    'Dudhi,Duplicate,999001',
  ].join('\n');
  assert.equal(extractVillages(csv).records.length, 1);
});

await test('an export with no recognisable columns fails loudly', () => {
  assert.throws(() => extractVillages('foo,bar\n1,2'), /Village Code/);
});

// --- env gates -------------------------------------------------------------
// env.ts throws at module load, so each case needs its own process. The point
// of ALLOW_DEV_OTP is that it unblocks the OTP flags and nothing else; a bug
// that let it soften DATABASE_URL or JWT_SECRET would be a silent production
// hole, so those cases are checked explicitly.

const PROD = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};

/** Load env.ts in a fresh process with exactly `vars` set. Returns stderr, or null if it booted. */
const loadEnv = (vars) => {
  const r = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--no-warnings', '-e', "import('./src/env.ts')"],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      // A clean env, not process.env: an inherited DATABASE_URL would mask a
      // missing-variable case and quietly turn these into no-ops.
      env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...vars },
    },
  );
  return r.status === 0 ? null : r.stderr;
};

await test('production refuses the dev-OTP flags by default', () => {
  const err = loadEnv({ ...PROD, OTP_DEV_MODE: 'true' });
  assert.match(err ?? '', /OTP_DEV_MODE=true is refused in production/);
});

await test('ALLOW_DEV_OTP=true admits the dev-OTP flags under NODE_ENV=production', () => {
  assert.equal(
    loadEnv({
      ...PROD,
      OTP_DEV_MODE: 'true',
      OTP_DEV_ECHO: 'true',
      OTP_DEV_FIXED_CODE: '1234',
      ALLOW_DEV_OTP: 'true',
    }),
    null,
  );
});

await test('ALLOW_DEV_OTP does not weaken the JWT_SECRET length gate', () => {
  const err = loadEnv({ ...PROD, JWT_SECRET: 'short', OTP_DEV_MODE: 'true', ALLOW_DEV_OTP: 'true' });
  assert.match(err ?? '', /JWT_SECRET must be at least 32 characters/);
});

await test('ALLOW_DEV_OTP does not make DATABASE_URL optional', () => {
  const err = loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32), ALLOW_DEV_OTP: 'true' });
  assert.match(err ?? '', /DATABASE_URL is required/);
});

console.log(`\nOK — ${n} api checks passed.`);
