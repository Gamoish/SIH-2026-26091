/**
 * Load the Sonbhadra Census 2011 village directory into `villages`.
 *
 *   pnpm api:import-census
 *
 * Where the data comes from (it is real, and it is not fabricated):
 *   Census of India 2011, Primary Census Abstract / Village Directory,
 *   Part-A extract for Sonbhadra district, Uttar Pradesh.
 *   Generator: db/seeds/import_villages.py  ->  db/seeds/villages_census_2011.sql
 *
 * The seed file is loaded into a staging table exactly as generated, then
 * mapped onto the app's schema here, so the provenance file stays readable
 * next to the raw export it came from.
 *
 * On identifiers: the Census village code is NOT the LGD code. Until the LGD
 * export is imported, these rows have `lgd_code = 'C11-<census code>'` - a
 * deliberately non-LGD-shaped placeholder, so nothing on screen or in the
 * database can be mistaken for a real Local Government Directory number.
 * `pnpm api:import-villages` fills in the true LGD codes when that export
 * lands; see the note at the bottom of this file.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrationPool as pool } from '../src/db.ts';

const seed = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'db',
  'seeds',
  'villages_census_2011.sql',
);

const SOURCE = 'Census 2011 PCA Part-A (village directory), Sonbhadra, Uttar Pradesh';

const client = await pool.connect();
try {
  await client.query('BEGIN');

  // staging holds the export verbatim; it is rebuilt on every run so a
  // re-import can never merge two different vintages of the file
  await client.query('DROP TABLE IF EXISTS villages_census_raw');
  await client.query(await readFile(seed, 'utf8'));

  const { rows: staged } = await client.query<{ count: string }>('SELECT count(*) FROM villages_census_raw');

  const { rowCount } = await client.query(
    `INSERT INTO villages (
       lgd_code, name, tehsil, district, state, source,
       census_code_2011, tehsil_code, population, households,
       sc_population, st_population, literacy_rate, name_duplicate_in_tehsil
     )
     SELECT
       'C11-' || village_code_2011,
       village_name,
       tehsil_name,
       'Sonbhadra',
       'Uttar Pradesh',
       $1,
       village_code_2011,
       tehsil_code,
       total_population,
       total_households,
       sc_population,
       st_population,
       literacy_rate,
       has_name_duplicate_in_tehsil
     FROM villages_census_raw
     ON CONFLICT (lgd_code) DO UPDATE SET
       name                     = EXCLUDED.name,
       tehsil                   = EXCLUDED.tehsil,
       source                   = EXCLUDED.source,
       census_code_2011         = EXCLUDED.census_code_2011,
       tehsil_code              = EXCLUDED.tehsil_code,
       population               = EXCLUDED.population,
       households               = EXCLUDED.households,
       name_duplicate_in_tehsil = EXCLUDED.name_duplicate_in_tehsil,
       imported_at              = now()`,
    [SOURCE],
  );

  await client.query('COMMIT');

  const { rows: summary } = await pool.query<{
    tehsil: string;
    villages: string;
    with_population: string;
    people: string | null;
  }>(
    `SELECT tehsil,
            count(*)                                   AS villages,
            count(population)                          AS with_population,
            sum(population)                            AS people
       FROM villages
      WHERE census_code_2011 IS NOT NULL
      GROUP BY tehsil ORDER BY tehsil`,
  );
  const dupes =
    (await pool.query<{ count: string }>('SELECT count(*) FROM villages WHERE name_duplicate_in_tehsil'))
      .rows[0]?.count ?? '0';

  console.log(`Staged ${staged[0]?.count ?? 0} census rows, wrote ${rowCount} into villages.`);
  for (const t of summary) {
    console.log(
      `  ${t.tehsil.padEnd(12)} ${t.villages.padStart(5)} villages, ` +
        `${t.with_population.padStart(5)} with a population figure, ` +
        `${Number(t.people ?? 0)
          .toLocaleString('en-IN')
          .padStart(10)} people`,
    );
  }
  console.log(`  ${dupes} village(s) share a name inside their tehsil - flagged for disambiguation.`);
  console.log(
    '\n  NOTE: these rows are keyed by Census 2011 code, not LGD code.\n' +
      '  Run `pnpm api:import-villages -- <lgd-export.csv>` to add the real LGD list.',
  );
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

await pool.end();
