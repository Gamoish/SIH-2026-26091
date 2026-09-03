import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrationPool as pool } from '../src/db.ts';

// migrations live in db/, one level above this package
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'db', 'migrations');

await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
  name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);

const applied = new Set(
  (await pool.query<{ name: string }>(`SELECT name FROM _migrations`)).rows.map((r) => r.name),
);

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
let ran = 0;

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await readFile(join(dir, file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(`INSERT INTO _migrations (name) VALUES ($1)`, [file]);
    await client.query('COMMIT');
    console.log(`  applied ${file}`);
    ran++;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  FAILED ${file}`);
    throw err;
  } finally {
    client.release();
  }
}

console.log(ran === 0 ? 'Already up to date.' : `Applied ${ran} migration(s).`);
await pool.end();
