# apps/web

The Disha frontend: Next.js 15, React 19, TypeScript. PWA, offline-capable.

Project overview and architecture live at the repository root —
[README](../../README.md) and [docs/architecture.md](../../docs/architecture.md).

## Structure

```
app/                 Next routes. Thin: each screen route re-exports a feature.
  layout.tsx         session provider, fonts, language toggle
  page.tsx           entry — routes to home or language selection
  screens/
    layout.tsx       route guard
    <slug>/page.tsx  one-line re-export

src/
  components/        shared UI: header, dock, button, row, bilingual text
  features/
    onboarding/      language, phone, otp, profile, location, capital, business
    report/          feasibility, full report, swot, competitors, pricing
    money/           scheme routing, repayment plan, shareable summary
    account/         home, applications, settings
  domain/            schemes (data), finance (deterministic), feasibility
  data/              MOCK_ fixtures and the mock API layer
  hooks/             use-session, use-case
  lib/               nav (routing + guards), format
  types/             shared domain types
  styles/

tests/
  finance.test.mjs   the money path — pure, no browser
  e2e/flow.spec.ts   the full user journey, phone and desktop
```

Routes stay thin so screens can be grouped by what they do rather than by URL.
Adding a screen means a feature component plus a one-line route file.

## Commands

```bash
pnpm dev          # http://localhost:3000
pnpm test         # financial engine
pnpm typecheck
pnpm lint
pnpm format
pnpm exec playwright test
```

E2E runs against a production build, not `next dev` — dev compiles routes on
first request, which under parallel workers looks like a test failure.

## Conventions

- `@/` resolves to `src/`.
- Screens read state through `useSession()` and derived values through
  `useCase()`; they never hold their own copy of an answer.
- Both languages render into the DOM and CSS hides one, so switching is instant.
- Mock data is `MOCK_`-prefixed and lives only in `src/data/`.
