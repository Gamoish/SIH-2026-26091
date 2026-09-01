-- Census 2011 village attributes for Sonbhadra.
--
-- The village list has two independent identifier systems and they are NOT
-- interchangeable:
--
--   lgd_code          - Local Government Directory (lgdirectory.gov.in), the
--                       administrative key the rest of the app uses.
--   census_code_2011  - Census of India 2011 village code, from the Primary
--                       Census Abstract / Village Directory.
--
-- A village has both, and they are different numbers. Storing one under the
-- other's name would put a wrong official identifier on screen, so they get
-- separate columns and a row may carry either or both.

ALTER TABLE villages ADD COLUMN IF NOT EXISTS census_code_2011 text;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS tehsil_code text;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS population int;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS households int;

-- Census 2011 Part-A carries neither the SC/ST split nor literacy for these
-- villages; the columns exist so a Part-B backfill has somewhere to land, and
-- stay NULL until it happens rather than being filled with an estimate.
ALTER TABLE villages ADD COLUMN IF NOT EXISTS sc_population int;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS st_population int;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS literacy_rate numeric;

-- 43 Sonbhadra villages share a name with another village in the same tehsil.
-- That is real Census data, not a duplicate row: the flag lets the location
-- screen force a disambiguation instead of letting someone pick the wrong one.
ALTER TABLE villages
  ADD COLUMN IF NOT EXISTS name_duplicate_in_tehsil boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS villages_census_code_idx
  ON villages (census_code_2011) WHERE census_code_2011 IS NOT NULL;

CREATE INDEX IF NOT EXISTS villages_population_idx ON villages (population);
