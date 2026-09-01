-- Disha app API: initial schema.
-- Phone + OTP auth, per-user onboarding and applications, and the LGD village
-- reference list the location step searches against.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------- users

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- E.164, always normalised before insert (see src/lib/phone.ts)
  phone_number  text NOT NULL UNIQUE CHECK (phone_number ~ '^\+91[6-9][0-9]{9}$'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

-- ------------------------------------------------------------ otp_codes

CREATE TABLE IF NOT EXISTS otp_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  -- Named code_hash, not code: the column holds a scrypt hash and never the
  -- code itself. The name is the guardrail against someone storing plaintext.
  code_hash    text NOT NULL,
  expires_at   timestamptz NOT NULL,
  verified     boolean NOT NULL DEFAULT false,
  attempts     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- the verify path always wants the newest unverified code for a phone
CREATE INDEX IF NOT EXISTS otp_codes_phone_created_idx
  ON otp_codes (phone_number, created_at DESC);

-- ------------------------------------------------------------- villages

-- The Sonbhadra village list, sourced from the Local Government Directory.
-- Populated only by scripts/import-villages.ts from an official LGD export;
-- never seeded with invented names. An empty table is an honest empty state.
CREATE TABLE IF NOT EXISTS villages (
  lgd_code   text PRIMARY KEY,
  name       text NOT NULL,
  tehsil     text NOT NULL,
  district   text NOT NULL DEFAULT 'Sonbhadra',
  state      text NOT NULL DEFAULT 'Uttar Pradesh',
  -- provenance, so a row can always be traced back to the file it came from
  source     text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS villages_tehsil_idx ON villages (tehsil);
-- prefix/substring search for the autocomplete
CREATE INDEX IF NOT EXISTS villages_name_lower_idx ON villages (lower(name) text_pattern_ops);

-- -------------------------------------------------- onboarding_profiles

CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  village_lgd_code  text REFERENCES villages (lgd_code),
  village_name      text,
  tehsil            text,
  -- GEN is included deliberately: the app lets a General-category applicant
  -- complete a feasibility report, it just has no loan scheme to route to.
  category          text CHECK (category IN ('SC', 'ST', 'OBC', 'GEN')),
  capital           numeric(12, 2) CHECK (capital IS NULL OR capital >= 0),
  business_category text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_profiles_user_idx
  ON onboarding_profiles (user_id, created_at DESC);

-- --------------------------------------------------------- applications

CREATE TABLE IF NOT EXISTS applications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  onboarding_profile_id uuid NOT NULL REFERENCES onboarding_profiles (id) ON DELETE CASCADE,
  feasibility_report    jsonb,
  financial_roadmap     jsonb,
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_user_idx ON applications (user_id, created_at DESC);
