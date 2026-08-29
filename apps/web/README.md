# web — the Disha frontend

A working prototype: you can pick a language, log in, answer three onboarding
questions, and reach a feasibility report and a repayment plan computed from
what you actually entered. Real data is still behind a mock layer — the money
is not.

One frontend, used responsively: the same screens at every viewport, with more
room and larger type past 720px. There is no second, denser reviewer UI. The
bank/CSC take-away is the printable summary on `/screens/share`.

## Layout

| | |
|---|---|
| `app/screens/<slug>/page.tsx` | one screen each |
| `app/screens/chrome.tsx` | shared header, step dots, bottom dock, primary button |
| `app/screens/layout.tsx` | route guard — see **Guards** |
| `app/globals.css` | design tokens, app shell, print styles |
| `lib/session.tsx` | the one client store: language + every onboarding answer |
| `lib/nav.ts` | route table and guard rules |
| `lib/schemes.ts` | seed rows for the `schemes` table — rates are data, not code |
| `lib/finance.ts` | the deterministic financial engine (no AI, no network) |
| `lib/feasibility.ts` | retrieval fixtures + derivation + narration |
| `lib/mock-api.ts` | request/response shapes the real services will use |
| `lib/use-case.ts` | turns the session into a report and a plan |

## The two engines

Kept apart on purpose.

**`lib/finance.ts` is real, not mocked.** It is pure arithmetic over scheme rows
and the capital the user typed — no model call, no fetch, no randomness, no
`Date.now()`. Same inputs, same rupees, every time. `pnpm test` checks the whole
path.

**`lib/feasibility.ts` is retrieval-first.** Every figure is computed from the
`MOCK_` fixtures before `narrate()` phrases it. The narration can only
interpolate numbers it was handed; it has no path to invent one. The fixtures
stand in for the Phase 0 pipeline (PostGIS radius queries, Udyam counts,
Agmarknet prices) and are `MOCK_`-prefixed so a stray import is obvious.

### Unconfirmed figures stay visibly missing

`NBCFDC` has no sourced figures, so its rate, tenure, moratorium and
contribution share are `null` in `lib/schemes.ts`. `planLoan` refuses to produce
numbers from a `null` and returns a gap instead, which the scheme screen renders
as "figures pending". Do not fill those in with 6% to match the other two — a
wrong number here is worse than a visible gap.

Nothing hardcodes the 10%/90% split either. `beneficiaryPct` is a column, and
`scripts/test-finance.mjs` asserts that changing it changes the project cost.

## Guards

`lib/nav.ts` records two things per screen: what it needs before it can honestly
render, and whether it is already behind the user.

A deep link to `/screens/scheme` with no session resolves the prerequisite chain
in one hop and lands on language selection, rather than showing a report about
nothing. And once a check is finished, home is the root of the app: the
onboarding steps redirect there, so pressing back from home never re-enters a
form the user already completed. Starting a new check clears `savedAt`, which
reopens them.

    language → phone → otp → social → location → capital → category → loading
             → feasibility → report → scheme → emi → share → home
                  ↘ competitors, pricing, swot
    home ⇄ saved ⇄ settings   (bottom dock)

`social` collects the applicant's category, which is the only input that decides
which channelizing agency they route to.

## Language

`data-lang` on `<html>`, with `.l-hi` / `.l-en` in `globals.css` hiding one. It
is stored in the session, so the first screen's choice, the floating pill and
the Settings switch are all the same state, and it survives reload. Bhashini
ASR/TTS is not wired; the voice affordances are shown as explicitly not-yet
rather than as buttons that do nothing.

## Commands

```bash
pnpm dev              # http://localhost:3000
pnpm test             # the financial engine — pure, fast, no browser
pnpm typecheck
npx playwright test   # the full flow, phone and desktop viewports
```

## Still mocked

Village populations, competitor counts and price bands are fixtures, not Census
/ Udyam / Agmarknet rows. OTP accepts one demo code (shown on the screen — there
is no SMS gateway yet). Nothing persists server-side: the session lives in
`localStorage`, so "your applications" holds one check. No Bhashini, no PostGIS,
no Postgres.
