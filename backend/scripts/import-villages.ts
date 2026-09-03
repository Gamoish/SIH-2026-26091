/**
 * Load the Sonbhadra village list from an official LGD export.
 *
 *   pnpm api:import-villages -- <path-to-export.csv>
 *
 * Where the file comes from (it is not committed, and is not fabricated):
 *   1. https://lgdirectory.gov.in  ->  Directory  ->  Village
 *   2. State: Uttar Pradesh, District: Sonbhadra
 *   3. Export the report as CSV; save it anywhere and pass the path.
 *
 * The parsing rules live in src/lib/lgd-csv.ts and are unit-tested there.
 */
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { migrationPool as pool } from '../src/db.ts';
import { extractVillages } from '../src/lib/lgd-csv.ts';

const path = process.argv[2];
if (!path) {
  console.error('Usage: import:villages -- <path-to-lgd-export.csv>');
  console.error('See the header of this file for where to get the export.');
  process.exit(1);
}

const { records, skipped } = extractVillages(await readFile(path, 'utf8'));
if (records.length === 0) throw new Error('No usable rows found in the export.');

const source = `LGD export: ${basename(path)}`;
const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const r of records) {
    await client.query(
      `INSERT INTO villages (lgd_code, name, tehsil, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lgd_code) DO UPDATE
         SET name = EXCLUDED.name, tehsil = EXCLUDED.tehsil,
             source = EXCLUDED.source, imported_at = now()`,
      [r.lgdCode, r.name, r.tehsil, source],
    );
  }
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

const tehsils = [...new Set(records.map((r) => r.tehsil))].sort();
console.log(`Imported ${records.length} villages across ${tehsils.length} tehsils.`);
console.log(`  tehsils: ${tehsils.join(', ')}`);
if (skipped.length) console.log(`  skipped ${skipped.length} unusable row(s).`);
await pool.end();
