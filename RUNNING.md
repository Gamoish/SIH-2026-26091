# Running Udyam Sathi

Two supported ways to start the project. Both end up at the same place —
frontend on `:3000`, API on `:4000`.

**The database is Supabase, and it is shared.** There is no local Postgres
container any more, so both routes need `backend/.env.local` filled in with real
connection URLs before anything will start. Copy `.env.example` for the shape.

| | Docker | Manual (pnpm) |
|---|---|---|
| Start | one command | two terminals |
| Hot reload | no (production build) | yes |
| Prerequisites | Docker, `backend/.env.local` | Node 22+, pnpm, `backend/.env.local` |
| Best for | a cold demo, onboarding someone new, "does it work from scratch" | day-to-day development |

Neither replaces the other. The Docker stack was added alongside the pnpm
workflow, which is still the faster loop when you are actually writing code.

---

## The two database URLs

`backend/.env.local` carries two, and they are not interchangeable:

| | Endpoint | Used by |
|---|---|---|
| `DATABASE_URL` | Supabase **transaction** pooler, `:6543` | the API server |
| `MIGRATION_DATABASE_URL` | Supabase **session** pooler, `:5432` | `pnpm api:migrate`, `pnpm api:import-census`, `pnpm api:import-villages` |

The split is not ceremony. The transaction pooler hands a connection back after
every statement, which is right for an API running short, independent queries —
and wrong for a migration, which holds one connection across a whole
transaction: DDL, a staging table built and read back, then `COMMIT`. The
session pooler keeps the connection for the life of the client, which is what
those scripts need. `backend/src/db.ts` builds a second, separate pool for
exactly this; `MIGRATION_DATABASE_URL` falls back to `DATABASE_URL` when unset,
which is what CI does against its own throwaway Postgres.

Neither is the **Direct** connection Supabase also offers. Direct is IPv6-only
without the paid IPv4 add-on, and nothing here needs it: no
`CREATE INDEX CONCURRENTLY`, no `VACUUM` outside a transaction, no advisory
locks, no `LISTEN`/`NOTIFY`, no logical replication. If a future migration adds
one of those it will need a true direct connection.

One real difference from a direct connection: the pooler enforces
`statement_timeout = 2min`. A single long statement in a migration is cut off
there, so split it or raise the timeout for that transaction.

Both URLs end in `?sslmode=no-verify`. That is TLS to the pooler without chain
verification — plain `sslmode=require` fails, because node-pg still treats it as
`verify-full` and the pooler presents a self-signed chain. Do not drop the
parameter: with no `sslmode` at all, node-pg connects in the clear.

---

## 1. Docker — one command

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

That brings up three things in order: migrations (one-shot) → the Fastify API →
the Next.js frontend. Each waits for the previous one to be genuinely ready, not
just started: the API via its `/health` endpoint, the migrations via running to a
successful exit.

Log in with any valid-looking 10-digit Indian mobile number. The OTP is fixed
at **1234** in this stack (`OTP_DEV_FIXED_CODE`), so you do not need to read the
logs. Village search offers the clearly-labelled demo fixtures, because the
`villages` table is empty until you import a real export (see below).

```bash
docker compose up --build       # start, rebuilding images
docker compose up -d            # start detached
docker compose logs -f api      # follow the API log
docker compose ps               # what is up, and is it healthy
docker compose down             # stop
```

There is no `down -v` equivalent any more: the database is Supabase and outlives
the stack. `docker compose down` stops containers and nothing else.

### Configuration

Container wiring lives in `docker-compose.yml`. `backend/.env.local` is now
**required**, not optional: it carries both database URLs, and there is no
in-network Postgres to fall back to. Optional extras — Bhashini credentials, an
SMS provider key — go in the same file.

One value is worth understanding before you change it:

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
pnpm api:migrate    # apply db/migrations, over the session pooler
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
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=no-verify
MIGRATION_DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=no-verify
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

These run over `MIGRATION_DATABASE_URL`, not the runtime one.

```bash
pnpm api:import-census                          # 1,429 Census 2011 villages
pnpm api:import-villages -- <lgd-export.csv>    # or an official LGD export
```

Once real villages are loaded, turn `NEXT_PUBLIC_DEMO_VILLAGES` off. Note that
the feasibility engine only has figures for the six demo fixtures, so a real
village currently reaches an honest "no figures for this village yet" screen
rather than a fabricated report.

---

## Deploying to Vercel

Two Vercel projects against this one repo, because they have different root
directories and different build outputs.

### Frontend project

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework preset | Next.js (detected) |
| Build / output settings | leave at the defaults |

Two things that are easy to get wrong:

**`outputFileTracingRoot` points at the workspace root, not `frontend/`.** That
is correct and must stay - pnpm hoists shared dependencies to the repo-root
`node_modules`, so tracing from the package directory would miss them. With Root
Directory set to `frontend`, Vercel still checks out the whole repository, so
the traced root resolves. Do not "fix" this to `import.meta.dirname`.

**`output: 'standalone'` must stay off.** Vercel produces its own Build Output
API format and ignores it. It is already gated behind `NEXT_STANDALONE=true`,
which only `frontend/Dockerfile` sets, so a Vercel build gets the default and
needs no change.

**`NEXT_PUBLIC_API_URL` must be set before the first build.** Next inlines
`NEXT_PUBLIC_*` into the client bundle at build time, so it is baked into the
JavaScript the browser downloads. Set it in the project's Environment Variables
*before* deploying, and remember that changing it later needs a **redeploy**, not
a restart - the same trap the Dockerfile documents for the compose stack. Point
it at the backend deployment's URL.

### Backend project

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Framework preset | Other |
| Build / output settings | leave empty - zero-config detection |

Vercel deploys a Node server with no adapter and no `vercel.json`: it finds
`src/server.ts`, sees the `listen()` call made during module startup, and routes
requests to it through an internal port. Detection does not follow imports, so
`src/server.ts` constructs the Fastify app itself and is the only
`server`/`index`/`app` file under `src/` - it is the entrypoint everywhere else
too (`pnpm dev`, `pnpm start`, Docker, Playwright).

Set `CORS_ORIGIN` to the frontend deployment's URL. The frontend calls the API
cross-origin (`NEXT_PUBLIC_API_URL` is an absolute URL), so the allow-list in
`src/server.ts` is load-bearing in production, not just locally.

Required environment variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and
either `OTP_PROVIDER_KEY` or - outside production only - `OTP_DEV_MODE=true`.
A missing or unsafe value fails the process at module load with a single
`[env] refusing to start` line listing **every** problem at once; grep the
function log for that prefix. It reports all of them together on purpose,
because on a serverless host each retry is a full redeploy.

### Migrations are NOT run by a Vercel deploy

Nothing about `vercel deploy` applies migrations, and this cannot be wired into
the build. `scripts/migrate.ts` needs two things a Vercel build and a Vercel
function both lack:

- the **session** pooler (`MIGRATION_DATABASE_URL`, `:5432`), because it holds
  one connection across a whole transaction - the runtime uses the transaction
  pooler (`:6543`), which cannot do that;
- read access to `db/migrations/`, which lives outside the backend project's
  root directory and is not part of the deployed bundle.

So applying a migration is a deliberate, separate step, run from a machine that
has `MIGRATION_DATABASE_URL` and the repo:

```bash
pnpm api:migrate
```

Run it **before** deploying the code that depends on it. The database is shared
across every environment, so a migration applied for a preview deployment is
also live for production - write migrations that the currently-deployed code can
still run against.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test           # unit: financial engine, case derivation, API helpers
pnpm e2e            # Playwright, phone + desktop + routing
```

`pnpm e2e` needs a migrated database (`pnpm api:migrate`); it starts its own API
and frontend on ports 4001/3111 so it will not collide with either stack above.
It reads the connection URL out of `backend/.env.local` and refuses to start
without one.

**It signs up real accounts in the shared Supabase database.** Its
`globalTeardown` deletes exactly the numbers the run minted, so a clean run
leaves nothing behind — but a run killed mid-flight does, and the next run's
teardown is what clears them.

---

## Troubleshooting

**`docker compose up` fails at the migrate step.** `docker compose logs migrate`
has the error. A missing or wrong `MIGRATION_DATABASE_URL` in
`backend/.env.local` looks like this too.

**Frontend loads but every API call fails.** Almost always
`NEXT_PUBLIC_API_URL`: check it is `http://localhost:4000` and rebuild with
`docker compose up --build`. A restart will not pick up the change.

**CORS errors in the browser console.** `CORS_ORIGIN` on the API must match the
origin you loaded the frontend from, including the port.

**Port already in use.** The stack wants 3000 and 4000. Running `pnpm dev` and
the `web` container at once will collide.

**`self-signed certificate in certificate chain`.** A URL with
`?sslmode=require` instead of `?sslmode=no-verify`. See the two-URL section
above.

