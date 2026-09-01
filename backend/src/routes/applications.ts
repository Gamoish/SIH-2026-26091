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

    const created = await queryOne<AppRow>(
      `INSERT INTO applications
         (user_id, onboarding_profile_id, feasibility_report, financial_roadmap, status)
       VALUES ($1, $2, $3, $4, $5)
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

    const updated = await queryOne<AppRow>(
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
    if (!updated) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ application: updated });
  });
}
