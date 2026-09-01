# दिशा · Disha

A hyper-local business feasibility and government loan-scheme advisor for rural
micro-entrepreneurs.

Someone with a phone, a few thousand rupees and an idea can find out whether the
business works *where they actually live* — how many people are within selling
distance, how many competitors already serve them, what price the local market
carries — and then get a concrete financing path: which government scheme they
qualify for, how much they can borrow, and what the monthly instalment is.

**Demo scope:** Sonbhadra district, Uttar Pradesh.
Built for SIH 2026 · PS 26091 · Ministry of Social Justice and Empowerment.

## Status

A working prototype. You can pick a language, log in, complete onboarding, and
reach a feasibility report and repayment plan computed from what you entered.

| Area | State |
|---|---|
| Frontend flow | Working end to end |
| Financial engine | **Real** — deterministic, tested, no AI |
| Feasibility engine | Real derivation over mock fixtures |
| Retrieval pipeline | Not built (PostGIS / Udyam / Agmarknet) |
| Bhashini voice & translation | Not wired |
| Backend services, database | Not built |

Nothing here should be shown to a borrower as final: every scheme figure is
marked with its source, and unconfirmed figures are rendered as visible gaps
rather than plausible-looking numbers.

## Quick start

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

The demo login accepts any valid-looking 10-digit mobile number; the OTP is
shown on screen, because there is no SMS gateway yet.

## Commands

```bash
pnpm dev           # frontend, hot reload
pnpm build         # production build
pnpm test          # financial engine — pure, fast, no browser
pnpm typecheck
pnpm lint
pnpm format        # prettier --write
pnpm e2e           # full user flow, phone and desktop viewports
```

## Repository layout

```
frontend/            Next.js frontend (PWA, offline-capable)
  app/               routes — thin, one re-export each
  src/
    components/      shared UI primitives
    features/        screens grouped by area: onboarding, report, money, account
    domain/          business logic: schemes, finance, feasibility
    data/            MOCK_ fixtures and the mock API layer
    hooks/           session store, derived case data
    lib/             routing rules, formatting
    types/           shared domain types
    styles/
  tests/             unit tests and Playwright e2e
design/              product design source
docs/                architecture and decisions
```

## Architecture

Two engines, kept deliberately apart.

**The financial engine** (`frontend/src/domain/finance.ts`) is pure arithmetic
over scheme rows and the capital the user entered. No model call, no network
call, no randomness — the same inputs always produce the same rupees. That is
what makes it auditable and testable, and it is why loan numbers are never
mocked even while everything around them is.

**The feasibility engine** (`frontend/src/domain/feasibility.ts`) retrieves
first and phrases second. Every figure is computed before `narrate()` turns it
into a sentence, so the narration layer can only describe numbers it was handed.
When the real retrieval pipeline and its grounded LLM land, that boundary stays
in the same place.

Scheme rules — interest, tenure, moratorium, contribution share — are **data**,
not constants in code. They live as rows in `src/domain/schemes.ts`, ready to
become a `schemes` table. See [docs/architecture.md](docs/architecture.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: scheme figures need a
source, the financial engine stays deterministic, and mock data stays obviously
mock.

## Licence

MIT — see [LICENSE](LICENSE).
