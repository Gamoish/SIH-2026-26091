/**
 * Pure-logic checks: phone normalisation, OTP hashing, and the LGD CSV parser.
 * No database and no server - these are the pieces where a quiet bug is a
 * security bug, so they are testable on their own.
 */
import assert from 'node:assert';
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

console.log(`\nOK — ${n} api checks passed.`);
