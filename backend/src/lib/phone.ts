/**
 * One canonical form for a phone number, everywhere: E.164, +91 followed by a
 * ten-digit Indian mobile number. Two rows for the same person is the failure
 * this prevents - "9876543210", "+919876543210" and "098765 43210" must all
 * resolve to the same user.
 */

const TEN_DIGIT = /^[6-9]\d{9}$/;

/** Returns the E.164 form, or null if this is not a valid Indian mobile number. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  // strip the country code or a trunk prefix, whichever is present
  const local = digits.startsWith('91') && digits.length === 12
    ? digits.slice(2)
    : digits.startsWith('0') && digits.length === 11
      ? digits.slice(1)
      : digits;

  return TEN_DIGIT.test(local) ? `+91${local}` : null;
}

/** Last four digits only - safe to put in a log line. */
export function maskPhone(e164: string): string {
  return `${e164.slice(0, 3)}******${e164.slice(-4)}`;
}
