# उद्यम साथी · Udyam Sathi

A feasibility-check and loan-advisory tool for entrepreneurs in Sonbhadra district, Uttar Pradesh. Built for Smart India Hackathon 2026.

Udyam Sathi helps an applicant check whether their business idea is viable, see a feasibility report, get matched to a government loan scheme (NSFDC/NSTFDC), and understand their repayment plan — in Hindi or English.

## What this is

One user-facing web app, with two layouts that share the same backend and the same data:

- **Mobile** — `/screens/*`
- **Desktop** — `/desktop/*`

You don't choose between them — the app detects your device automatically. Both show the same person's own data; there is no separate reviewer/officer console in this repo (that's a different, not-yet-built project).

## Stack

- **Frontend:** Next.js 15 + TypeScript
- **Backend:** Fastify + TypeScript
- **Database:** PostgreSQL
- **Package manager:** pnpm (workspaces)

## Getting started

See [`RUNNING.md`](./RUNNING.md) for full setup instructions, including both the Docker and manual-run paths.

Quick start (Docker):

```bash
docker compose up
```

Quick start (manual):

```bash
pnpm install
pnpm db:up        # starts Postgres
pnpm api:dev      # starts backend
pnpm dev          # starts frontend
```

Frontend: `http://localhost:3000`
Backend API: `http://localhost:4000`

## Project structure

```
frontend/    Next.js app — both /screens (mobile) and /desktop layouts
backend/     Fastify API
db/          Postgres compose file + migrations
docs/        Architecture notes
```

## Documentation

* `RUNNING.md` — how to run the project
* `docs/architecture.md` — architecture notes
* `CLAUDE.md` — project conventions and rules for AI-assisted development on this repo
