import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.ts';

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  tehsil: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

type VillageRow = { lgd_code: string; name: string; tehsil: string };

export async function villageRoutes(app: FastifyInstance): Promise<void> {
  /**
   * The location step's autocomplete. Public: it is a government directory, and
   * the user needs it before they have finished onboarding.
   *
   * Returns an empty list with `loaded: false` when the table has not been
   * imported, so the UI can say "the village list has not been loaded" instead
   * of pretending Sonbhadra has no villages.
   */
  app.get('/api/villages', async (req, reply) => {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_request' });
    const { q, tehsil, limit } = parsed.data;

    const [total] = await query<{ count: string }>(`SELECT count(*) FROM villages`);
    const loaded = Number(total?.count ?? 0) > 0;

    const rows = await query<VillageRow>(
      `SELECT lgd_code, name, tehsil
         FROM villages
        WHERE ($1::text IS NULL OR lower(name) LIKE lower($1) || '%'
                                OR lower(name) LIKE '%' || lower($1) || '%')
          AND ($2::text IS NULL OR tehsil = $2)
        ORDER BY
          -- prefix matches first, then alphabetical, so typing "ro" surfaces
          -- Robertsganj-area names before an incidental mid-word match
          CASE WHEN $1::text IS NOT NULL AND lower(name) LIKE lower($1) || '%' THEN 0 ELSE 1 END,
          name
        LIMIT $3`,
      [q ?? null, tehsil ?? null, limit],
    );

    return reply.send({ loaded, count: Number(total?.count ?? 0), villages: rows });
  });

  /** Tehsils actually present in the imported data, for the grouped picker. */
  app.get('/api/villages/tehsils', async (_req, reply) => {
    const rows = await query<{ tehsil: string; count: string }>(
      `SELECT tehsil, count(*) FROM villages GROUP BY tehsil ORDER BY tehsil`,
    );
    return reply.send({
      tehsils: rows.map((r) => ({ tehsil: r.tehsil, village_count: Number(r.count) })),
    });
  });
}
