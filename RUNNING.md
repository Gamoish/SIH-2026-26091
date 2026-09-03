# Running Udyam Sathi

Two supported ways to start the project. Both end up at the same place —
frontend on `:3000`, API on `:4000`, Postgres on `:5433`.

| | Docker | Manual (pnpm) |
|---|---|---|
| Start | one command | three terminals |
| Hot reload | no (production build) | yes |
| Prerequisites | Docker only | Node 22+, pnpm, Docker for Postgres |
| Best for | a cold demo, onboarding someone new, "does it work from scratch" | day-to-day development |

Neither replaces the other. The Docker stack was added alongside the pnpm
workflow, which is still the faster loop when you are actually writing code.

---

## 1. Docker — one command

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

That brings up four things in order: Postgres → migrations (one-shot) → the
Fastify API → the Next.js frontend. Each waits for the previous one to be
genuinely ready, not just started: Postgres via `pg_isready`, the API via its
`/health` endpoint, the migrations via running to a successful exit.

Log in with any valid-looking 10-digit Indian mobile number. The OTP is fixed
at **1234** in this stack (`OTP_DEV_FIXED_CODE`), so you do not need to read the
logs. Village search offers the clearly-labelled demo fixtures, because the
`villages` table is empty until you import a real export (see below).

```bash
docker compose up --build       # start, rebuilding images
docker compose up -d            # start detached
docker compose logs -f api      # follow the API log
docker compose ps               # what is up, and is it healthy
docker compose down             # stop, keep the database volume
docker compose down -v          # stop and DELETE the database
```

### Configuration

Container wiring lives in `docker-compose.yml`. Optional extras — Bhashini
credentials, an SMS provider key — are read from `backend/.env.local` if that
file exists, and ignored if it does not. Copy `.env.example` to get the shape.

Two values are worth understanding before you change them:

**`DATABASE_URL` inside the network is `postgresql://udyam_sathi:udyam_sathi@db:5432/udyam_sathi`.**
Port **5432**, not 5433. The host publishes 5433 so the container cannot shadow
a Postgres you may already run locally, but that mapping does not apply between
containers — they talk on the internal port.

**`NEXT_PUBLIC_API_URL` is a build argument, not a runtime variable.** Next
inlines `NEXT_PUBLIC_*` into the JavaScript bundle at build time, so setting it
under `environment:` does nothing. It must stay `http://localhost:4000` — the
address your *browser* reaches the API on. Setting it to `http://api:4000` looks
more "correct" and breaks everything: that hostname only resolves inside the
Docker network, and the fetch runs on your machine. Changing it needs a
`--build`, not a restart.

**`NEXT_STANDALONE=true` is set only in the frontend Dockerfile.** It switches
on Next's standalone output, which is what keeps the web image at ~416MB
instead of ~1.9GB. It is deliberately *not* the default in `next.config.ts`,
because standalone output copies traced dependencies as symlinks and pnpm's
symlinked store makes that fail on Windows with `EPERM: operation not
permitted, symlink` - which would break `pnpm build` and the whole Playwright
suite on any Windows machine. The container builds on Linux, where this is a
non-issue. Do not "tidy" it into the config as an unconditional option.

The API container deliberately does **not** set `NODE_ENV=production`. In
production `backend/src/env.ts` correctly refuses to boot without a real 32-char
`JWT_SECRET` and a configured SMS provider, neither of which exists in a local
demo stack. This is a development stack; do not deploy it as-is.

---

## 2. Manual — per-package scripts

```bash
pnpm install

pnpm db:up          # Postgres in Docker, host port 5433
pnpm api:migrate    # apply db/migrations
```

Then, in two terminals:

```bash
pnpm api:dev        # Fastify API on :4000, watch mode
pnpm dev            # Next.js frontend on :3000, hot reload
```

The API reads `backend/.env.local`; the frontend reads `frontend/.env.local`.
Copy `.env.example` for the expected shape. Neither is committed.

For a first run, `backend/.env.local` needs at minimum:

```
DATABASE_URL=postgresql://udyam_sathi:udyam_sathi@localhost:5433/udyam_sathi
JWT_SECRET=any-long-string-for-local-use-only-0123456789
OTP_DEV_MODE=true
OTP_DEV_FIXED_CODE=1234
CORS_ORIGIN=http://localhost:3000
```

and `frontend/.env.local` wants `NEXT_PUBLIC_DEMO_VILLAGES=true` until real
village data is imported.

---

## Real village data

Both routes start with an empty `villages` table, and the location screen says
so rather than inventing a list. To load the real Sonbhadra rows:

```bash
pnpm api:import-census                          # 1,429 Census 2011 villages
pnpm api:import-villages -- <lgd-export.csv>    # or an official LGD export
```

Once real villages are loaded, turn `NEXT_PUBLIC_DEMO_VILLAGES` off. Note that
the feasibility engine only has figures for the six demo fixtures, so a real
village currently reaches an honest "no figures for this village yet" screen
rather than a fabricated report.

---

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test           # unit: financial engine, case derivation, API helpers
pnpm e2e            # Playwright, phone + desktop + routing
```

`pnpm e2e` needs Postgres up and migrated (`pnpm db:up && pnpm api:migrate`); it
starts its own API and frontend on ports 4001/3111 so it will not collide with
either stack above.

---

## Troubleshooting

**`docker compose up` fails at the migrate step.** Postgres is healthy but the
schema failed to apply — `docker compose logs migrate` has the SQL error.

**Frontend loads but every API call fails.** Almost always
`NEXT_PUBLIC_API_URL`: check it is `http://localhost:4000` and rebuild with
`docker compose up --build`. A restart will not pick up the change.

**CORS errors in the browser console.** `CORS_ORIGIN` on the API must match the
origin you loaded the frontend from, including the port.

**Port already in use.** The stack wants 3000, 4000 and 5433. `pnpm db:up` and
`docker compose up` share the same Postgres container, so running both is fine —
running `pnpm dev` and the `web` container at once is not.

