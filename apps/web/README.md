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

## The monument motif

Every screen carries its own Indian monument as a faint silhouette at the bottom,
above a thin tricolour strip — Taj Mahal on the capital step, Charminar on phone
entry, Brihadeeswarar Temple on SWOT, and so on. Twenty-one screens, twenty-one
monuments, no repeats.

- `public/monuments/*.svg` — one silhouette each, all on a shared `0 0 640 130`
  canvas with a common baseline so they read as one family.
- `src/lib/monuments.ts` — the screen-to-monument map.
- `app/screens/layout.tsx` — sets `--monument` per route, so no screen knows
  about any of this.
- `src/styles/globals.css` — `.dc-phone::before` masks the SVG and colours it
  from `--navy`; `::after` draws the tricolour.

## Editing a profile, without reopening the first run

`language`, `phone`, `otp` and `social` are first-run screens: they establish who
the account is and are seen exactly once. `lib/nav.ts` lists them in
`FIRST_RUN_ONLY`, and `firstRunBlock()` sends a logged-in user home if they ever
try to open one — by deep link, by browser back, or from a row in Settings.

Editing those fields later goes through purpose-built screens instead, which
share styling with the first-run steps but no navigation with them:

- name and phone → a `Sheet` bottom-sheet on the Settings screen itself, so the
  edit is never a route and can never be deep-linked. Changing the phone number
  re-verifies it by OTP in the sheet, because the phone number _is_ the login.
- photo and category → `screens/edit-photo` and `screens/edit-category`, full
  screens because a preview and a scheme explanation need the room.

`firstRunBlock()` is applied by `app/screens/layout.tsx` on route _entry_ only,
not on every state change. The last identity step is the one that makes the
account exist, so a guard that also watched state would throw the user off that
screen at the moment they completed it — cancelling their own move to the next
step. `redirectFor()` still runs on every render for the ordinary flow
prerequisites.

Because it is a CSS mask, the SVGs are plain shapes and the tone comes from a
variable. A white fill inside one would render **solid**, not as a hole — a mask
reads alpha. Cut holes with a single `fill-rule="evenodd"` path instead (see
`jantar-mantar.svg`); `tests/monuments.test.mjs` guards against the mistake, along
with missing files, orphans and duplicate assignments.

Both layers are `pointer-events: none` at `z-index: 0`, with `.dc-phone > *`
lifted to `z-index: 1`, so the motif can never intercept a tap or sit over the
CTA. Hidden in print. A screen with no mapping falls back to `public/skyline.svg`,
a combined strip.

`--skyline-h` is deliberately taller than the monuments themselves. The band is
anchored to the bottom of the frame, and the CTA plus its padding occupy roughly
the lowest 86px — at a shorter height the whole silhouette hid behind the button
on screens whose monument sits low, such as Sanchi Stupa. Shrinking it will make
those screens look empty again.
