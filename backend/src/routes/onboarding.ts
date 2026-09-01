import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db.ts';
import { requireAuth, authed } from '../plugins/auth.ts';

// Note there is no user_id here, deliberately. It comes from the token.
const profileBody = z.object({
  village_lgd_code: z.string().trim().min(1).max(32).nullable().optional(),
  village_name: z.string().trim().max(160).nullable().optional(),
  tehsil: z.string().trim().max(80).nullable().optional(),
  category: z.enum(['SC', 'ST', 'OBC', 'GEN']).nullable().optional(),
  capital: z.number().finite().nonnegative().max(1e10).nullable().optional(),
  business_category: z.string().trim().max(80).nullable().optional(),
});

type ProfileRow = {
  id: string;
  village_lgd_code: string | null;
  village_name: string | null;
  tehsil: string | null;
  category: string | null;
  capital: number | null;
  business_category: string | null;
  created_at: Date;
};

const SELECT = `id, village_lgd_code, village_name, tehsil, category, capital, business_category, created_at`;

export async function onboardingRoutes(app: FastifyInstance): Promise<void> {
  /** The signed-in user's current onboarding profile, or null. */
  app.get('/api/onboarding/profile', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const profile = await queryOne<ProfileRow>(
      `SELECT ${SELECT} FROM onboarding_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    return reply.send({ profile });
  });

  /**
   * Create or update the profile for the authenticated user. Onboarding fills
   * this in one step at a time, so every field is optional and a PUT merges
   * rather than replaces.
   *
   * The village name and tehsil are resolved from the LGD code server-side when
   * a code is given: the client may not decide that village 123456 is called
   * whatever it likes.
   */
  app.put('/api/onboarding/profile', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const parsed = profileBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request', detail: parsed.error.issues });

    const patch = { ...parsed.data };

    if (patch.village_lgd_code) {
      const village = await queryOne<{ name: string; tehsil: string }>(
        `SELECT name, tehsil FROM villages WHERE lgd_code = $1`,
        [patch.village_lgd_code],
      );
      if (!village) return reply.code(400).send({ error: 'unknown_village_lgd_code' });
      patch.village_name = village.name;
      patch.tehsil = village.tehsil;
    }

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM onboarding_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );

    if (!existing) {
      const created = await queryOne<ProfileRow>(
        `INSERT INTO onboarding_profiles
           (user_id, village_lgd_code, village_name, tehsil, category, capital, business_category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${SELECT}`,
        [
          userId,
          patch.village_lgd_code ?? null,
          patch.village_name ?? null,
          patch.tehsil ?? null,
          patch.category ?? null,
          patch.capital ?? null,
          patch.business_category ?? null,
        ],
      );
      return reply.code(201).send({ profile: created });
    }

    // COALESCE on the parameter keeps any column the caller did not mention.
    // `user_id = $1` in the WHERE is what scopes the write to this account.
    const updated = await queryOne<ProfileRow>(
      `UPDATE onboarding_profiles SET
         village_lgd_code  = COALESCE($3, village_lgd_code),
         village_name      = COALESCE($4, village_name),
         tehsil            = COALESCE($5, tehsil),
         category          = COALESCE($6, category),
         capital           = COALESCE($7, capital),
         business_category = COALESCE($8, business_category)
       WHERE id = $2 AND user_id = $1
       RETURNING ${SELECT}`,
      [
        userId,
        existing.id,
        patch.village_lgd_code ?? null,
        patch.village_name ?? null,
        patch.tehsil ?? null,
        patch.category ?? null,
        patch.capital ?? null,
        patch.business_category ?? null,
      ],
    );
    return reply.send({ profile: updated });
  });

  /** Start a fresh check: a new profile row, leaving the old one on record. */
  app.post('/api/onboarding/profile', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const parsed = profileBody.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });

    const created = await queryOne<ProfileRow>(
      `INSERT INTO onboarding_profiles (user_id, category) VALUES ($1, $2) RETURNING ${SELECT}`,
      [userId, parsed.data.category ?? null],
    );
    return reply.code(201).send({ profile: created });
  });

  /** Every profile this user has created, newest first. */
  app.get('/api/onboarding/profiles', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const profiles = await query<ProfileRow>(
      `SELECT ${SELECT} FROM onboarding_profiles WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return reply.send({ profiles });
  });
}
