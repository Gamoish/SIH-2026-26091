/**
 * Configuration, validated once at boot. A missing or unsafe value stops the
 * process here rather than surfacing as a 500 on the auth path later.
 */

/**
 * Every misconfiguration found, not just the first.
 *
 * This used to throw on the earliest problem, which is fine when you are
 * watching a local process start and can fix-and-restart in seconds. On a
 * serverless host each attempt is a full redeploy, so one-error-at-a-time
 * turns a three-variable mistake into three deploy cycles. Collect, then fail
 * once with the whole list.
 */
const problems: string[] = [];

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) {
    problems.push(`${name} is required. Copy .env.example to .env.local and fill it in.`);
    return '';
  }
  return v;
};

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isProduction = NODE_ENV === 'production';

/**
 * Dev mode logs the OTP to the console instead of sending an SMS. It must be
 * asked for explicitly (OTP_DEV_MODE=true) and is refused outright in
 * production - there is no silent fallback when the SMS provider is
 * unconfigured, because that fallback would mean anyone could log in as anyone.
 */
const otpDevMode = process.env.OTP_DEV_MODE === 'true';
if (otpDevMode && isProduction) {
  problems.push('OTP_DEV_MODE=true is refused in production: it prints login codes to the log.');
}

/**
 * Returns the code in the request-otp response, for automated tests that cannot
 * read the server's console. Refused in production for the same reason dev mode
 * is: it hands a login code to anyone who can call the endpoint.
 */
const otpDevEcho = process.env.OTP_DEV_ECHO === 'true';
if (otpDevEcho && isProduction) {
  problems.push('OTP_DEV_ECHO=true is refused in production: it returns login codes to the caller.');
}
if (otpDevEcho && !otpDevMode) {
  problems.push('OTP_DEV_ECHO=true requires OTP_DEV_MODE=true.');
}

/**
 * A fixed code instead of a random one, so local and demo use does not need the
 * server log. It changes only which digits are issued: the code is still
 * hashed, stored, expired, attempt-limited and verified exactly as a real one,
 * so the auth path itself is never bypassed.
 *
 * Refused in production, and refused without dev mode, for the same reason the
 * other two flags are: a known code is a login for anyone who guesses the flag
 * is on.
 */
const otpFixedCode = process.env.OTP_DEV_FIXED_CODE ?? '';
if (otpFixedCode && isProduction) {
  problems.push('OTP_DEV_FIXED_CODE is refused in production: it makes every login code guessable.');
}
if (otpFixedCode && !otpDevMode) {
  problems.push('OTP_DEV_FIXED_CODE requires OTP_DEV_MODE=true.');
}
if (otpFixedCode && !/^\d{4}$/.test(otpFixedCode)) {
  problems.push('OTP_DEV_FIXED_CODE must be exactly 4 digits.');
}

const databaseUrl = required('DATABASE_URL');
const jwtSecret = required('JWT_SECRET');
if (isProduction && jwtSecret && jwtSecret.length < 32) {
  problems.push('JWT_SECRET must be at least 32 characters in production.');
}

if (isProduction && !otpDevMode && !process.env.OTP_PROVIDER_KEY) {
  problems.push('OTP_PROVIDER_KEY is required in production: no SMS provider is configured.');
}

/**
 * One loud, complete failure. The prefix is deliberately greppable: on Vercel
 * this is what you search the function log for, and a module-load throw is
 * otherwise indistinguishable from any other 500.
 */
if (problems.length > 0) {
  throw new Error(
    `[env] refusing to start - ${problems.length} configuration problem(s):\n` +
      problems.map((m) => `  - ${m}`).join('\n'),
  );
}

export const env = {
  nodeEnv: NODE_ENV,
  isProduction,
  /** PORT is what every managed host assigns; API_PORT is the local knob. */
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  databaseUrl,
  jwtSecret,
  jwtIssuer: 'udyam-sathi-api',
  /** How long a session token is good for. */
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 60 * 60 * 24 * 30),
  otp: {
    devMode: otpDevMode,
    devEcho: otpDevEcho,
    /** Empty in every real deployment; a 4-digit string only in dev/demo. */
    fixedCode: otpFixedCode,
    length: 4,
    ttlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
    /** Wrong guesses allowed against one code before a resend is required. */
    maxAttempts: 5,
    /** Codes a single number may request inside the resend window. */
    maxPerWindow: 5,
    resendWindowSeconds: 900,
    providerKey: process.env.OTP_PROVIDER_KEY ?? '',
    senderId: process.env.OTP_SENDER_ID ?? 'UDYAM',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
} as const;
