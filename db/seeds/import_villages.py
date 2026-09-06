"""
Import script: Sonbhadra village census data -> `villages` table.

Source: sonbhadra_primary_census_abstract.csv (Census 2011 Village Directory
extract, Part-A). Columns present: village_code_2011, village_name,
tehsil_code, tehsil_name, total_population, total_households.
sc_population, st_population, literacy_rate are NOT present in this file —
left NULL here, to be backfilled later from the Part-B Primary Census
Abstract (SC/ST district-level tables on censusindia.gov.in, or the
data.gov.in "Village/Town-wise Primary Census Abstract" dataset for the
matching UP district).

43 villages share a name with another village in the same tehsil (this is
normal, real Census data — not a bug). Each is flagged via
`has_name_duplicate_in_tehsil` so the frontend can force disambiguation
(e.g. show gram panchayat or a nearby landmark) rather than letting a user
pick the wrong one from an ambiguous name match.

NOTE: the input CSV is not in this repository - only the output it produced,
`villages_census_2011.sql`, which is what `backend/scripts/import-census.ts`
loads. This script is kept as the provenance record for that file: it documents
exactly how the committed SQL was derived from the Census extract. Re-running it
means fetching the source CSV again (see "Source" above) and placing it next to
this file as `sonbhadra_primary_census_abstract.csv`.
"""

import csv
import sys
from collections import Counter

INPUT_CSV = "sonbhadra_primary_census_abstract.csv"
OUTPUT_SQL = "villages_seed.sql"


def load_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def find_duplicate_names(rows):
    """(tehsil_name, village_name) pairs that appear more than once."""
    pair_counts = Counter((r["tehsil_name"].strip(), r["village_name"].strip()) for r in rows)
    return {pair for pair, count in pair_counts.items() if count > 1}


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def to_int_or_null(value: str):
    value = (value or "").strip()
    return value if value.isdigit() else "NULL"


def build_insert_statements(rows, duplicate_pairs):
    statements = []
    for r in rows:
        village_code = sql_escape(r["village_code_2011"].strip())
        village_name = sql_escape(r["village_name"].strip())
        tehsil_code = sql_escape(r["tehsil_code"].strip())
        tehsil_name = sql_escape(r["tehsil_name"].strip())
        total_population = to_int_or_null(r["total_population"])
        total_households = to_int_or_null(r["total_households"])

        is_duplicate = (r["tehsil_name"].strip(), r["village_name"].strip()) in duplicate_pairs

        statements.append(
            "INSERT INTO villages "
            "(village_code_2011, village_name, tehsil_code, tehsil_name, "
            "total_population, total_households, sc_population, st_population, "
            "literacy_rate, has_name_duplicate_in_tehsil) VALUES "
            f"('{village_code}', '{village_name}', '{tehsil_code}', '{tehsil_name}', "
            f"{total_population}, {total_households}, NULL, NULL, NULL, "
            f"{'TRUE' if is_duplicate else 'FALSE'});"
        )
    return statements


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS villages (
  id SERIAL PRIMARY KEY,
  village_code_2011 TEXT NOT NULL UNIQUE,
  village_name TEXT NOT NULL,
  tehsil_code TEXT NOT NULL,
  tehsil_name TEXT NOT NULL,
  total_population INT,
  total_households INT,
  sc_population INT,
  st_population INT,
  literacy_rate NUMERIC,
  has_name_duplicate_in_tehsil BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_villages_tehsil ON villages(tehsil_name);
CREATE INDEX IF NOT EXISTS idx_villages_name_search ON villages(village_name);
"""


def main():
    rows = load_rows(INPUT_CSV)
    duplicate_pairs = find_duplicate_names(rows)

    print(f"Loaded {len(rows)} villages")
    print(f"Found {len(duplicate_pairs)} duplicate (tehsil, name) pairs — flagged for UI disambiguation")

    inserts = build_insert_statements(rows, duplicate_pairs)

    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write(CREATE_TABLE_SQL)
        f.write("\n\n")
        f.write("\n".join(inserts))
        f.write("\n")

    print(f"Wrote {len(inserts)} insert statements to {OUTPUT_SQL}")
    missing_pop = sum(1 for r in rows if not r["total_population"].strip())
    print(f"Note: {missing_pop} villages have no total_population figure (likely uninhabited villages)")
    print("Note: sc_population, st_population, literacy_rate are NULL for all rows —")
    print("backfill from the Part-B Primary Census Abstract before using these fields.")


if __name__ == "__main__":
    main()
