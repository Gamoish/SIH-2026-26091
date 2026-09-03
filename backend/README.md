# Udyam Sathi app API

Phone + OTP authentication, and per-user onboarding and application storage.
Fastify + PostgreSQL. No AI anywhere in this service.

## Running it

```bash
cp .env.example backend/.env.local   # fill in the Supabase URLs and JWT_SECRET
pnpm api:migrate
pnpm api:dev                   # http://localhost:4000
```

The database is Supabase; there is no local Postgres. Two URLs, on purpose:
`DATABASE_URL` is the **transaction** pooler (`:6543`) the server runs on, and
`MIGRATION_DATABASE_URL` is the **session** pooler (`:5432`) the migration and
import scripts use, because those hold one connection across a whole
transaction. See `src/db.ts`; `MIGRATION_DATABASE_URL` falls back to
`DATABASE_URL` when unset, which is what CI does against a throwaway Postgres.

## The village list

`villages` is **empty until you import an official LGD export**. Nothing seeds
it, and no village name in this repo is invented.

```
1. https://lgdirectory.gov.in  ->  Directory  ->  Village
2. State: Uttar Pradesh,  District: Sonbhadra
3. Export as CSV
4. pnpm api:import-villages -- /path/to/export.csv
```

The importer finds the header row even under a title line, tolerates the column
spellings LGD has used across releases (`Village Code` / `Village LGD Code`,
`Sub-District Name` / `Tehsil`), skips any row without a numeric LGD code, and
records which file each row came from in `villages.source`.

Until then `GET /api/villages` answers `{"loaded": false, "villages": []}` and
the location screen says the list has not been loaded. That is deliberate: an
empty list is honest, invented village names are not.

For a demo without the export, set `NEXT_PUBLIC_DEMO_VILLAGES=true` in the web
app. The six fixture villages are then offered, labelled on screen as demo data,
and stored with a **null** `village_lgd_code` so they can never be mistaken for
directory entries.

## OTP delivery

Two modes, chosen by an explicit flag, never by whether a key happens to be set:

| | |
|---|---|
| `OTP_DEV_MODE=true` | the code is printed to the API console, no SMS is sent |
| otherwise | `sendOtpSms()` calls the SMS provider |

`src/env.ts` refuses to boot if `OTP_DEV_MODE=true` in production, and refuses to
boot in production without `OTP_PROVIDER_KEY`. A silent "no key, so just log it"
fallback would make a misconfigured deploy an open door.

`OTP_DEV_ECHO=true` additionally returns the code in the response, for automated
tests that cannot read the console. It requires dev mode and is refused in
production too.

**The SMS gateway is not wired up.** `sendOtpSms()` throws outside dev mode.
Bhashini is speech and translation only and does not send SMS, so this needs a
DLT-registered transactional gateway (MSG91 / Gupshup / Textlocal). Left as a
visible hole rather than a plausible call to an unconfirmed endpoint.

## Endpoints

| Method | Path | Auth | |
|---|---|---|---|
| POST | `/api/auth/request-otp` | — | issue a code |
| POST | `/api/auth/verify-otp` | — | redeem it; creates the user on first success |
| GET | `/api/auth/me` | bearer | who the token belongs to |
| GET | `/api/villages` | — | `?q=`, `?tehsil=`, `?limit=` |
| GET | `/api/villages/tehsils` | — | tehsils present in the imported data |
| GET/PUT/POST | `/api/onboarding/profile` | bearer | read / merge / start a new one |
| GET | `/api/onboarding/profiles` | bearer | all of this user's profiles |
| GET/POST/PATCH | `/api/applications` | bearer | saved report + roadmap snapshots |

## How user data is scoped

The user id comes from the signed token and from nowhere else. No route reads a
`user_id` from a body, query or header — a forged one is simply ignored, and
every write carries `WHERE user_id = $1`.

Requesting another account's application returns **404, not 403**: a 403 would
confirm that the id exists.

Other properties worth knowing:

- Codes are stored as salted scrypt hashes, compared in constant time. A
  database leak yields no live codes.
- Codes are single-use and burnt before the token is issued, so a replayed
  request cannot mint a second session.
- Requesting a new code retires any previous unverified one.
- 5 wrong guesses burn a code — after that even the correct code is refused.
- 5 code requests per number per 15 minutes, so the endpoint cannot be used to
  bomb someone with SMS.
- `request-otp` never reveals whether a number already has an account.
- Phone numbers are normalised to E.164 before they touch the database, so
  `9876543210`, `+919876543210` and `098765 43210` are one account, not three.

## Tests

```bash
pnpm --filter @udyam-sathi/backend test
```

Pure logic only — phone normalisation, OTP hashing, and the LGD CSV rules. No
database needed. The HTTP and isolation behaviour is covered by the web app's
Playwright suite, which runs against this service for real.
