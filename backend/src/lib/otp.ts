import { randomInt, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 32;

/**
 * A numeric code, from the CSPRNG. randomInt is rejection-sampled, so unlike
 * `Math.random()` or `% 10000` it has no modulo bias - every code is equally
 * likely, which is the whole point of a one-time code.
 */
export function generateCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += randomInt(0, 10).toString();
  return out;
}

/**
 * Codes are stored hashed, never in plaintext: a database leak must not hand
 * over live login codes. scrypt is deliberately slow, and each code carries its
 * own salt, so the stored value is useless for a lookup table.
 */
export async function hashCode(code: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(code, salt, KEYLEN);
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/** Constant-time verification: never leaks how much of the code was right. */
export async function verifyCode(code: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, 'base64');
  if (expected.length !== KEYLEN) return false;

  const actual = await scryptAsync(code, Buffer.from(saltB64, 'base64'), KEYLEN);
  return timingSafeEqual(actual, expected);
}
