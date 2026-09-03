import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db.ts';
import { requireAuth, authed } from '../plugins/auth.ts';

const jsonValue: z.ZodType<unknown> = z.unknown();

const createBody = z.object({
  onboarding_profile_id: z.string().uuid(),
  feasibility_report: jsonValue.nullable().optional(),
  financial_roadmap: jsonValue.nullable().optional(),
  status: z.enum(['draft', 'complete']).default('draft'),
});

const updateBody = z.object({
  feasibility_report: jsonValue.nullable().optional(),
  financial_roadmap: jsonValue.nullable().optional(),
  status: z.enum(['draft', 'complete']).optional(),
});

type AppRow = {
  id: string;
  onboarding_profile_id: string;
  feasibility_report: unknown;
  financial_roadmap: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
};

const SELECT = `id, onboarding_profile_id, feasibility_report, financial_roadmap, status, created_at, updated_at`;

export async function applicationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/applications', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const applications = await query<AppRow>(
      `SELECT ${SELECT} FROM applications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return reply.send({ applications });
  });

  app.get('/api/applications/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const id = z.string().uuid().safeParse((req.params as { id?: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'invalid_request' });

    const application = await queryOne<AppRow>(
      `SELECT ${SELECT} FROM applications WHERE id = $1 AND user_id = $2`,
      [id.data, userId],
    );
    // 404 rather than 403 for someone else's row: the response must not confirm
    // that an id exists on another account.
    if (!application) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ application });
  });

  /**
   * Snapshot a finished check. The report and roadmap are stored as given -
   * they are a record of what the user was shown at the time, so they must not
   * be recomputed later against changed scheme rows.
   *
   * Filing is idempotent per onboarding profile, which is what makes it safe
   * for the client to file the same case twice. It does that more often than it
   * looks: the browser records `savedAt` only when the response arrives, so a
   * user who leaves the share screen mid-flight files the row and never learns
   * its id, and the next visit files it again. Rather than racing that on the
   * client, `applications_one_complete_per_profile_idx` (migration 003) makes
   * the second attempt land on the same row.
   */
  app.post('/api/applications', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request', detail: parsed.error.issues });

    // The profile must belong to the caller. Without this check a client could
    // hang its application off someone else's onboarding row.
    const profile = await queryOne<{ id: string }>(
      `SELECT id FROM onboarding_profiles WHERE id = $1 AND user_id = $2`,
      [parsed.data.onboarding_profile_id, userId],
    );
    if (!profile) return reply.code(400).send({ error: 'unknown_onboarding_profile' });

    // The conflict target repeats the index predicate because the index is a
    // partial one; that is how Postgres infers which index arbitrates. A draft
    // does not satisfy the predicate, so it never conflicts here and several
    // drafts per profile stay legal.
    //
    // No ownership check is needed on the DO UPDATE: the conflicting row hangs
    // off this same onboarding profile, and the profile was confirmed to belong
    // to the caller a few lines above.
    const created = await queryOne<AppRow>(
      `INSERT INTO applications
         (user_id, onboarding_profile_id, feasibility_report, financial_roadmap, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (onboarding_profile_id) WHERE status = 'complete'
       DO UPDATE SET
         feasibility_report = EXCLUDED.feasibility_report,
         financial_roadmap  = EXCLUDED.financial_roadmap,
         updated_at         = now()
       RETURNING ${SELECT}`,
      [
        userId,
        parsed.data.onboarding_profile_id,
        parsed.data.feasibility_report ?? null,
        parsed.data.financial_roadmap ?? null,
        parsed.data.status,
      ],
    );
    return reply.code(201).send({ application: created });
  });

  app.patch('/api/applications/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = authed(req);
    const id = z.string().uuid().safeParse((req.params as { id?: string }).id);
    if (!id.success) return reply.code(400).send({ error: 'invalid_request' });

    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });

    // Promoting a draft to `complete` can collide with the one-complete-per-
    // profile index (migration 003). That is a conflict with an existing row,
    // not a server fault, so it answers 409 rather than falling through to a
    // 500. The POST path upserts instead; here there is no single obvious row
    // to merge into, so the caller is told rather than guessed for.
    let updated: AppRow | null;
    try {
      updated = await queryOne<AppRow>(
        `UPDATE applications SET
           feasibility_report = COALESCE($3, feasibility_report),
           financial_roadmap  = COALESCE($4, financial_roadmap),
           status             = COALESCE($5, status),
           updated_at         = now()
         WHERE id = $1 AND user_id = $2
         RETURNING ${SELECT}`,
        [
          id.data,
          userId,
          parsed.data.feasibility_report ?? null,
          parsed.data.financial_roadmap ?? null,
          parsed.data.status ?? null,
        ],
      );
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return reply.code(409).send({ error: 'application_already_complete' });
      }
      throw err;
    }
    if (!updated) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ application: updated });
  });
}
