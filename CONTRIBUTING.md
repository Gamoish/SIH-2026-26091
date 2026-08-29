# Contributing

## Setup

Node 22+ and pnpm. `pnpm install`, then `pnpm dev`.

## Before opening a pull request

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm e2e
```

CI runs the same four.

## Rules that are not negotiable

These exist because the output of this app is a number someone may take to a
bank. They are enforced by review, and mostly by tests.

**1. The financial engine never calls an LLM or any external API.**
`src/domain/finance.ts` is pure functions over scheme rows. If a change there
would need a model call to produce an answer, something has gone wrong in the
design — stop and raise it.

**2. Scheme rules are data, never constants in code.**
Interest, tenure, moratorium, minimum and maximum project cost, and contribution
share live in `src/domain/schemes.ts` as rows. Never hardcode a 10%/90% split:
different schemes have different contribution structures, and
`tests/finance.test.mjs` asserts that changing the column changes the result.

**3. Never guess a rate, tenure or moratorium.**
Use the figure from the scheme document and record where it came from in the
row's `source` field. If a figure is not confirmed, leave it `null` with a
`TODO: confirm` note. The engine refuses to compute from a `null` and the UI
renders a visible gap. A wrong number here is worse than an obvious hole.

**4. The feasibility engine's narration only phrases retrieved numbers.**
Retrieval runs first and produces the figures; `narrate()` puts them into a
sentence. It must never originate a market-reach figure, competitor count or
price. If narration happens before or instead of retrieval, that is a bug.

**5. Mock data is always obviously mock.**
Prefix it `MOCK_` and keep it in `src/data/`. It must never be mistakable for
real government statistics.

**6. Keep the two engines separate.**
Do not merge finance and feasibility for convenience. The separation is what
keeps auditable money logic away from probabilistic report generation.

**7. The UI stays radically simple.**
One primary number or decision per screen, large touch targets, plain-language
labels beside any financial term. One frontend used responsively — a wider
viewport gets more room, not a denser layout.

**8. Authentication is phone number plus OTP.**
No email/password, no social login.

**9. Never commit secrets.**
Use `.env.local`, and keep `.env.example` current with the expected shape.

## Style

Prettier and ESLint are configured; run `pnpm format` before committing. Route
files under `app/` stay thin — screens live in `src/features/`.
