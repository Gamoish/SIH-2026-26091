/**
 * Parsing for an official LGD village export. Pure: no database, no filesystem,
 * so the rules about what counts as a usable row are testable on their own.
 *
 * The shapes are tolerant because LGD's export headers have drifted between
 * releases, but the content rules are strict - a row without a numeric LGD code
 * and a village name is reported as skipped, never guessed at.
 */

// --- CSV parsing: quoted fields, embedded commas, CRLF, doubled quotes -------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Find the index of the first header matching any of these shapes. */
export function findColumn(headers: string[], candidates: string[]): number {
  const normalised = headers.map(norm);
  for (const c of candidates) {
    const i = normalised.indexOf(norm(c));
    if (i !== -1) return i;
  }
  // fall back to a contains-match, e.g. "Village Name (In English)"
  for (const c of candidates) {
    const i = normalised.findIndex((h) => h.includes(norm(c)));
    if (i !== -1) return i;
  }
  return -1;
}

export type VillageRecord = { lgdCode: string; name: string; tehsil: string };

export function extractVillages(csv: string): { records: VillageRecord[]; skipped: string[] } {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error('The CSV has no data rows.');

  // LGD exports sometimes carry a title line above the real header, so find the
  // header row rather than assuming it is the first.
  let headerIdx = -1;
  let codeCol = -1;
  let nameCol = -1;
  let tehsilCol = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const header = rows[i]!;
    const code = findColumn(header, ['Village Code', 'VillageCode', 'Village LGD Code', 'LGD Code']);
    const name = findColumn(header, ['Village Name', 'VillageName', 'Village Name (In English)', 'Village']);
    const teh = findColumn(header, ['Sub District Name', 'SubDistrict Name', 'Sub-District Name', 'Tehsil', 'Taluk', 'Block Name']);
    if (code !== -1 && name !== -1) {
      headerIdx = i;
      codeCol = code;
      nameCol = name;
      tehsilCol = teh;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      'Could not find a "Village Code" and "Village Name" column. ' +
        `Headers seen: ${rows[0]?.join(' | ')}`,
    );
  }
  if (tehsilCol === -1) {
    throw new Error('Could not find a sub-district/tehsil column; the picker groups by tehsil.');
  }

  const records: VillageRecord[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const row of rows.slice(headerIdx + 1)) {
    const lgdCode = (row[codeCol] ?? '').trim();
    const name = (row[nameCol] ?? '').trim();
    const tehsil = (row[tehsilCol] ?? '').trim();

    if (!/^\d+$/.test(lgdCode) || !name || !tehsil) {
      skipped.push(row.join(','));
      continue;
    }
    if (seen.has(lgdCode)) continue;
    seen.add(lgdCode);
    records.push({ lgdCode, name, tehsil });
  }
  return { records, skipped };
}
