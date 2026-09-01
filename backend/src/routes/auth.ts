import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.ts';
import { query, queryOne } from '../db.ts';
import { generateCode, hashCode, verifyCode } from '../lib/otp.ts';
import { normalisePhone, maskPhone } from '../lib/phone.ts';
import { issueToken } from '../lib/jwt.ts';
import { sendOtpSms } from '../lib/sms.ts';
import { requireAuth, authed } from '../plugins/auth.ts';

const requestOtpBody = z.object({ phone_number: z.string().min(1).max(24) });
const verifyOtpBody = z.object({
  phone_number: z.string().min(1).max(24),
  code: z.string().regex(/^\d{4,8}$/),
});

type OtpRow = {
  id: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  verified: boolean;
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Step 1 - issue a code.
   *
   * The response never says whether the number is already registered: that
   * would turn this endpoint into a "does this person have an account" oracle.
   */
  app.post('/api/auth/request-otp', async (req, reply) => {
    const parsed = requestOtpBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });

    const phone = normalisePhone(parsed.data.phone_number);
    if (!phone) return reply.code(400).send({ error: 'invalid_phone' });

    // Resend throttle: cap how many codes a single number can pull in the
    // window, so this endpoint cannot be used to bomb someone with SMS.
    const [recent] = await query<{ count: string }>(
      `SELECT count(*) FROM otp_codes
        WHERE phone_number = $1 AND created_at > now() - ($2 || ' seconds')::interval`,
      [phone, env.otp.resendWindowSeconds],
    );
    if (Number(recent?.count ?? 0) >= env.otp.maxPerWindow) {
      return reply.code(429).send({ error: 'too_many_requests', retry_after_sec: env.otp.resendWindowSeconds });
    }

    // A new code retires the old ones, so only the latest can ever be redeemed.
    await query(`UPDATE otp_codes SET expires_at = now() WHERE phone_number = $1 AND verified = false`, [phone]);

    // A fixed dev code when the flag is set; otherwise from the CSPRNG.
    const code = env.otp.fixedCode || generateCode(env.otp.length);
    await query(
      `INSERT INTO otp_codes (phone_number, code_hash, expires_at)
       VALUES ($1, $2, now() + ($3 || ' seconds')::interval)`,
      [phone, await hashCode(code), env.otp.ttlSeconds],
    );

    await sendOtpSms(phone, code);
    req.log.info({ phone: maskPhone(phone) }, 'otp issued');

    return reply.send({
      ok: true,
      phone_number: phone,
      expires_in_sec: env.otp.ttlSeconds,
      code_length: env.otp.length,
      // Never the code itself - only whether the operator will find it in the
      // log. The one exception is OTP_DEV_ECHO, an explicit test-only flag that
      // env.ts refuses to accept in production.
      dev_mode: env.otp.devMode,
      ...(env.otp.devEcho ? { MOCK_dev_code: code } : {}),
    });
  });

  /**
   * Step 2 - redeem a code for a session.
   *
   * Creates the user row on first successful verification, so there is no
   * separate signup: the phone number that proves itself is the account.
   */
  app.post('/api/auth/verify-otp', async (req, reply) => {
    const parsed = verifyOtpBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });

    const phone = normalisePhone(parsed.data.phone_number);
    if (!phone) return reply.code(400).send({ error: 'invalid_phone' });

    const otp = await queryOne<OtpRow>(
      `SELECT id, code_hash, expires_at, attempts, verified
         FROM otp_codes
        WHERE phone_number = $1 AND verified = false
        ORDER BY created_at DESC
        LIMIT 1`,
      [phone],
    );

    if (!otp) return reply.code(400).send({ error: 'no_active_code' });
    if (otp.expires_at.getTime() <= Date.now()) return reply.code(400).send({ error: 'code_expired' });

    // The cap is checked before the comparison, so a burnt code cannot be
    // brute-forced by continuing to guess against it.
    if (otp.attempts >= env.otp.maxAttempts) {
      return reply.code(429).send({ error: 'too_many_attempts' });
    }

    if (!(await verifyCode(parsed.data.code, otp.code_hash))) {
      const [row] = await query<{ attempts: number }>(
        `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`,
        [otp.id],
      );
      const attempts = row?.attempts ?? otp.attempts + 1;
      return reply.code(400).send({
        error: 'invalid_code',
        attempts_remaining: Math.max(0, env.otp.maxAttempts - attempts),
      });
    }

    // Single-use: burn the code before the session exists, so a replay of the
    // same request cannot mint a second token.
    const burnt = await query(
      `UPDATE otp_codes SET verified = true WHERE id = $1 AND verified = false RETURNING id`,
      [otp.id],
    );
    if (burnt.length === 0) return reply.code(400).send({ error: 'code_already_used' });

    const user = await queryOne<{ id: string; created_at: Date; last_login_at: Date | null }>(
      `INSERT INTO users (phone_number, last_login_at) VALUES ($1, now())
       ON CONFLICT (phone_number) DO UPDATE SET last_login_at = now()
       RETURNING id, created_at, last_login_at`,
      [phone],
    );
    if (!user) return reply.code(500).send({ error: 'user_upsert_failed' });

    req.log.info({ phone: maskPhone(phone), userId: user.id }, 'otp verified');

    return reply.send({
      token: await issueToken({ userId: user.id, phone }),
      user: { id: user.id, phone_number: phone },
      // lets the client route a brand-new account into onboarding
      is_new_user: user.created_at.getTime() === user.last_login_at?.getTime(),
    });
  });

  /** Who the bearer token belongs to. Used by the client to restore a session. */
  app.get('/api/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const user = await queryOne<{ id: string; phone_number: string; created_at: Date }>(
      `SELECT id, phone_number, created_at FROM users WHERE id = $1`,
      [userId],
    );
    if (!user) return reply.code(401).send({ error: 'unauthenticated' });
    return reply.send({ user });
  });
}
