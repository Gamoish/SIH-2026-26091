# CLAUDE.md

Project context for Claude Code. Read this before making changes.

## What this is

A hyper-local business feasibility + government loan-scheme calculator for
rural micro-entrepreneurs (SIH 2026, PS 26091, Ministry of Social Justice
and Empowerment). Demo scope: Sonbhadra district, Uttar Pradesh. See
`PRD.md` for the full product spec.

One user — the entrepreneur — in two layouts of the same app:
- **Phone (`/screens/*`)** — the primary surface. Must be usable by a
  first-time, possibly low-literacy user, voice-first, one decision per
  screen.
- **Desktop (`/desktop/*`)** — the same person's same case, laid out for a
  wider viewport: the report, scheme, and repayment plan on one wide page
  instead of a sequence of small ones. A bank officer or judge reviewing a
  case reads this same view — it is not a separate reviewer app, and there
  is no logged-in reviewer role.

Both layouts read from one session and one `caseFrom()` derivation, so
they can never disagree about a number.

## The wider system — three separate projects

**This repo is the user portal only.** The full product is three separate,
independently deployed projects, each its own repository:

| | Project | Audience | Status |
|---|---|---|---|
| 1 | **Marketing site** | the public | not yet built — **not this repo** |
| 2 | **User portal** — `udyam-sathi/` | the entrepreneur / applicant | **this repo** |
| 3 | **Administrator portal** | bank / government officers | not yet started — **not this repo** |

```
        ┌─────────────────────┐
        │   Marketing site    │   separate repo, not built yet
        │  (public landing)   │   links out to both portals
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│   USER PORTAL    │  │  ADMIN PORTAL    │  separate repo,
│    (this repo)   │  │  officer review  │  not started
│                  │  └──────────────────┘
│  mobile  desktop │
│/screens/ /desktop/│   two frontends
│      \     /     │
│    one backend   │   Fastify + Postgres
└──────────────────┘
```

**The user portal (this repo)** serves one audience — the entrepreneur — with
two frontends over one backend: mobile at `/screens/*` and desktop at
`/desktop/*`. That split is rule 5 below.

**The administrator portal is a different project and must not be built
here.** Officer review — an application queue, approve/reject, another
person's case — belongs in that separate repo. This is why the earlier
`/officer/*` scaffolding was removed from this codebase rather than fixed:
it was not a bug in the user portal, it was functionality that belongs to a
different project entirely. If a request would add reviewer features here,
stop and flag it.

**These are three repos, not a monorepo.** There is no shared tooling, no
shared design-token package, no shared component library, and no common
build or release pipeline between them. Nothing propagates automatically:
the design tokens in `frontend/src/styles/tokens.css` are local to this
repo, and if visual consistency across the three projects is wanted, it has
to be maintained by hand in each one. Do not write code here that assumes a
shared package, a cross-repo import, or a sibling project's build.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, React, TypeScript — PWA, offline-capable. **No CSS framework**: styling is React inline `style` objects plus the design tokens in `frontend/src/styles/tokens.css`. This line used to claim Tailwind, which was never installed. |
| Voice/language | Bhashini APIs (ASR, NMT, TTS) — 22 scheduled languages |
| App API | Node.js (Express/Fastify), TypeScript |
| Feasibility engine | Python (FastAPI) — retrieval + grounded LLM narration |
| Financial engine | Node.js, deterministic rules only — no AI, no LLM calls |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| DevOps | Docker, GitHub Actions |
| Testing | Playwright (e2e) |

## Repository layout

```
udyam-sathi/
├── frontend/   Next.js 15 PWA - the one UI, used responsively
├── backend/    Fastify app API - auth, onboarding, applications
├── db/         Postgres schema, migrations, docker-compose
├── docs/       architecture notes
└── design/     the design canvas
```

`frontend` is `@udyam-sathi/frontend`, `backend` is `@udyam-sathi/backend`; both are pnpm
workspace packages. The Python feasibility service is not scaffolded yet and
will sit alongside them as `feasibility/`.

This workspace covers the user portal and nothing else. The marketing site
and the administrator portal are not directories here and never will be —
they are their own repositories (see "The wider system" above).

## Build & dev commands

```bash
# install
pnpm install

# database (Postgres on host port 5433, so it cannot shadow a local 5432)
pnpm db:up
pnpm api:migrate

# frontend only, hot reload
pnpm dev

# node api only
pnpm api:dev

# load the real Sonbhadra village list from an official LGD export
pnpm api:import-villages -- <path-to-export.csv>

# lint / type check / unit tests / e2e
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e

# build for production
pnpm build
```

These are verified against the real `package.json`.

## Rules Claude must always follow

1. **The financial engine never calls an LLM or any external AI API.**
   Loan eligibility, scheme matching, and EMI/moratorium calculations must
   be pure, deterministic, testable functions. If a change to this engine
   would require an AI call to produce an answer, stop and flag it —
   something has gone wrong in the design.

2. **Scheme rules live in the `schemes` table, never hardcoded in app
   logic.** Interest rate, tenure, moratorium, min/max project cost, and
   contribution percentage for NSFDC, NSTFDC, and NBCFDC are data, not
   constants in code. Do not hardcode a 10%/90% ratio anywhere — different
   schemes have different contribution structures.

3. **The feasibility engine's LLM layer only narrates retrieved numbers.**
   It must never generate a market-reach figure, competitor count, or price
   recommendation from its own reasoning — those come from the retrieval
   step (PostGIS queries, Udyam/Agmarknet lookups) first, and the LLM's job
   is to phrase what was already computed, in the user's language. If you
   are implementing this layer and the LLM call happens before or instead
   of a data retrieval step, that's a bug.

4. **Never fabricate demo data that looks like real government statistics.**
   Placeholder/mock data used before Phase 0's real pipeline lands must be
   clearly marked as mock in code (e.g. a `MOCK_` prefix or a fixtures
   folder), so it's never confused with or accidentally shipped as real
   Sonbhadra data.

5. **One frontend, one user — the entrepreneur — in two layouts.**
   `/screens/*` is phone-optimized, `/desktop/*` is desktop-optimized. Same
   person, same session, same `buildReport()`/`planLoan()` output — not two
   different experiences and not two user roles. Neither layout invents
   data the other doesn't have. Both stay radically simple: one primary
   number or decision per view, large touch targets, plain-language labels
   next to any financial term (EMI, moratorium, tenure).

   Both layouts get their data from `caseFrom(session)` in
   `src/domain/case.ts`. If a view needs a figure that isn't derivable from
   the session, that's the signal to stop — not to reach for a fixture.

   Context: this rule is about the *user portal*, which is all this repo is.
   The officer-facing side of the product is a separate project — see "The
   wider system" above. "Not two user roles" means there is no reviewer role
   *here*; it does not mean the product never has one.

6. **Never guess at scheme interest rates, tenure, or moratorium periods.**
   Use the exact figures from the PS text and the real NSFDC/NSTFDC/NBCFDC
   scheme documents. If a needed figure isn't confirmed yet, leave it as an
   explicit `TODO: confirm rate` rather than inventing a plausible-looking
   number — a wrong number here is worse than a visible gap.

7. **Don't add authentication complexity beyond phone number + OTP.** No
   email/password flows, no third-party social login — the target user's
   familiar pattern is phone + OTP (PhonePe/PayTM/Aadhaar-linked apps).

8. **Keep the two engines (financial, feasibility) as separate services.**
   Don't merge them into one module for convenience — the separation is
   what keeps the auditable money logic isolated from the probabilistic
   report-generation logic.

9. **Never commit real API keys, Bhashini credentials, or database URLs.**
   Use `.env.local` (gitignored) and reference `.env.example` for the
   expected shape.

10. **Don't restructure the monorepo layout, rename services, or change the
    tech stack choices above without flagging it first** — these were
    deliberate team decisions (see `PRD.md` and the team's SIH prep notes),
    not defaults to optimize away.
