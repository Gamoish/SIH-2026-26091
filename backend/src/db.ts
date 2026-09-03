import pg from 'pg';
import { env } from './env.ts';

// numeric comes back as a string by default so big values keep their precision.
// capital is money we do arithmetic on, and it is well inside float range, so
// parse it - but only this one type, deliberately.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => (v === null ? null : Number(v)));

/**
 * One connection per instance, for Vercel.
 *
 * The cap that matters is Supabase's: max_client_conn on the pooler is shared
 * by every warm instance at once, so the budget is (instances x max), not max.
 * 10 was right for a single long-lived server and would blow that budget here.
 *
 * ponytail: fixed at 1. Note that fluid compute runs several invocations in one
 * process, so concurrent requests on the same instance queue behind this single
 * connection - raise it to ~3 if the API starts serialising under load.
 */
export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 1 });

/**
 * For the migration and import scripts, which need one connection held across a
 * whole transaction: DDL, multi-statement SQL, a staging table built and read
 * back before COMMIT. Against Supabase that means the *session* pooler (:5432),
 * not the transaction pooler (:6543) the server runs on. Falls back to the
 * runtime URL when MIGRATION_DATABASE_URL is unset (a plain local Postgres).
 *
 * pg.Pool opens nothing until first query, so the unused one costs nothing.
 */
export const migrationPool = new pg.Pool({
  connectionString: process.env.MIGRATION_DATABASE_URL || env.databaseUrl,
  max: 2,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}

/** First row, or null. */
export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
