import { env } from '../env.ts';
import { maskPhone } from './phone.ts';

/**
 * Delivery of the one-time code.
 *
 * There are exactly two modes, and which one is active is decided by an
 * explicit flag, never by whether a provider key happens to be present:
 *
 *   OTP_DEV_MODE=true  -> the code is printed to the console, no SMS is sent
 *   otherwise          -> the code goes to the SMS provider
 *
 * A silent "no key configured, so just log it" fallback would turn a
 * misconfigured production deploy into an open door, so env.ts refuses that
 * combination at boot instead.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (env.otp.devMode) {
    // eslint-disable-next-line no-console
    console.info(`[OTP_DEV_MODE] code for ${maskPhone(phone)} is ${code}`);
    return;
  }

  // TODO: wire the real provider. Bhashini is speech/translation only and does
  // not send SMS, so this is a transactional SMS gateway (MSG91 / Gupshup /
  // Textlocal) on a DLT-registered template. Left as an explicit hole rather
  // than a plausible-looking call to an endpoint nobody has confirmed.
  throw new Error(
    'No SMS provider is wired up yet. Set OTP_DEV_MODE=true for local use, ' +
      'or implement sendOtpSms() against your DLT-registered gateway.',
  );
}
