# Architecture

## Why two engines

The app answers two different kinds of question, and they need different
guarantees.

*"Will this business work here?"* is a judgement over incomplete data. It draws
on population, competitor density and local prices, and it produces an estimate
that is allowed to be approximate, and eventually to be phrased by a language
model.

*"What will I owe every month?"* is not a judgement. It is arithmetic with one
right answer, and the person asking may carry it into a bank. It must be
reproducible, inspectable, and identical every time.

Mixing those two produces a system where nobody can tell which numbers are firm.
So they are separate modules today, and separate services later:

| | Feasibility | Finance |
|---|---|---|
| Module | `src/domain/feasibility.ts` | `src/domain/finance.ts` |
| Nature | probabilistic, approximate | deterministic, exact |
| Inputs | fixtures now; PostGIS, Udyam, Agmarknet later | scheme rows + user capital |
| AI | narration layer, grounded on retrieved figures | none, ever |
| Eventual home | Python / FastAPI service | Node service |

## Scheme rules are data

`src/domain/schemes.ts` holds one row per channelizing agency, with interest,
tenure, moratorium and the applicant's contribution share as columns. It is
shaped to become a `schemes` table, and the seed for it.

This matters because the agencies do not share a structure. Code that assumes
"the applicant puts in 10% and borrows 90%" is correct for one product and
silently wrong for the next. `planLoan` reads `beneficiaryPct` from the row, and
a test asserts that changing the column changes the project cost.

## Unconfirmed figures are visible holes

Every scheme row carries a `source`. Where a figure has not been confirmed
against the scheme document, the column is `null` and the source says so.

`planLoan` refuses to compute from a `null`; it returns a gap describing which
columns are missing, and the scheme screen renders "figures pending" instead of
an instalment. NBCFDC is in that state today.

The alternative — filling the gap with a plausible 6% to match the neighbouring
schemes — produces a screen that looks finished and tells someone the wrong
monthly payment. A visible hole is the safer failure.

## The narration boundary

`buildReport()` computes every figure. `narrate()` receives the finished report
and turns it into a sentence in the user's language. It has no access to the
fixtures and no path to originate a number.

When a real model replaces the template, the contract is unchanged: retrieval
runs first, and the model only phrases what it was handed. If a call ever
happens before or instead of retrieval, that is the bug to look for.

## State and routing

The session — language plus every onboarding answer — lives in one client store
(`src/hooks/use-session.tsx`), persisted to `localStorage`. Screens derive from
it rather than holding copies, so nothing downstream can disagree with what the
user entered. Both engines are pure, so `useCase()` re-derives on render and
there is no stale report to invalidate.

Routing rules live in `src/lib/nav.ts` as two tables: what each screen needs
before it can honestly render, and which steps are already behind the user. The
first stops a bookmark from opening a report about nothing; the second makes
home the root once a check is finished, so back never re-enters completed
onboarding.

## One frontend

The design was drawn as separate phone and desktop artboards, because a canvas
has to draw both. The app is one responsive column: a wider viewport gets more
room and larger type, never a denser layout or a second reviewer UI. A bank
officer reviewing a case sees the same screens the entrepreneur used.
