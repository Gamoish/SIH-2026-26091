# PRD — Rural Business Feasibility & Loan Scheme Assistant
### SIH 2026, PS 26091 (Ministry of Social Justice and Empowerment)

## Problem

Rural entrepreneurs receiving government concessional loans (margin money
from the entrepreneur + a subsidized loan from a State Channelizing Agency)
often pick a business without knowing whether it will work in their
specific village, and don't understand which scheme they qualify for or
what repayment will actually look like. Many funded businesses stagnate as
a result — not from lack of capital, but from lack of information before
the loan was taken.

## Who this is for

A first-generation rural entrepreneur — limited formal schooling in many
cases, more comfortable speaking than reading or typing, often using a
shared or family phone, opening a financial app for the first time with no
one there to walk them through it. Demo scope: Sonbhadra district, Uttar
Pradesh (mixed SC/ST population).

A secondary user — a bank officer, CSC (Common Service Centre) staff
member, or SIH judge — reviews the same output, often on a laptop. This is
the same frontend, same simple design, just laid out responsively for a
wider screen — not a separate denser view. The exportable/printable summary
is what gives a reviewer the fuller picture, not a different UI.

## What we're building

Three inputs from the user — location, available capital, proposed
business category — produce two outputs:

1. **A hyper-local feasibility report**: is this business likely to work
   here, based on market reach, existing competition, suggested pricing,
   and risks specific to that village/block.
2. **A financial roadmap**: the project cost this capital supports, which
   government scheme (NSFDC, NSTFDC, or NBCFDC, depending on the
   applicant's category) they're matched to, and what repayment — EMI and
   moratorium — actually looks like.

The two are delivered together, in one flow, in the user's own language,
before they apply for the actual loan.

## Core features

**Module 1 — Feasibility report**
- Market reach: consumer base within a 5–10km radius, distribution channels
- Opportunity analysis: underserved niches for the chosen category locally
- SWOT tailored to the specific budget and location
- Threats: supply chain, seasonal demand, single-buyer dependency
- Competitor mapping: density of similar businesses nearby
- Pricing recommendation based on regional purchasing power

**Module 2 — Financial calculator & scheme router**
- Automatic project cost and loan eligibility from available capital
- Scheme auto-selection (NSFDC/NSTFDC/NBCFDC, by category and project cost
  band) — data-driven, not a hardcoded ratio
- EMI and moratorium schedule, in plain language

**Cross-cutting**
- Voice-first input/output in the user's own language (Bhashini)
- Phone number + OTP login (no email/password)
- Offline-tolerant (rural connectivity is unreliable)
- Printable/shareable summary the entrepreneur can carry to a bank

## What the experience looks like, on any device

One decision per screen. Language selection first, before any other UI
text. Voice as the primary input, typing as a fallback. Numbers shown large
and standalone (not in tables). The feasibility verdict is a single simple
answer first (good sign / worth checking), with detail available behind
one "know more" tap. Visual tone is calm and official — closer to
UMANG/DigiLocker than a fintech startup. This is one responsive frontend,
not a simple phone version and a separate dense desktop version — a bank
officer or judge reviewing on a laptop sees the same screens, just
comfortably laid out for the wider viewport, plus the printable summary as
their take-away artifact.

## How this solves the problem statement

| PS requirement | This solution |
|---|---|
| Location, capital, category as inputs | 3-question onboarding |
| Market reach, opportunity, SWOT, threats, competitor mapping, pricing | Module 1 |
| Financial structuring, scheme auto-selection, EMI/moratorium | Module 2 |
| NLP-powered, multilingual | Bhashini voice layer |

## Differentiation

Existing tools solve one half of this: government loan portals (e.g.
Mahashabari in Maharashtra, UPSCFDC in UP) digitize applications but do no
feasibility check; credit apps (Tala, Branch) check eligibility with no
market research; market-advisory tools (DeHaat, AgNext) give local
pricing/demand insight but only for agriculture and with no financing tied
to it; AI business-plan generators (Bizplanr-style tools) produce generic
write-ups with no local grounding and no scheme-specific numbers. Nothing
combines "will this work here" with "can I afford it, under which specific
scheme" in one flow.

## Non-goals (for the prototype)

- Full national coverage — demo data pipeline is scoped to Sonbhadra
- All 22 Bhashini languages — demo covers 2 (Hindi + one regional language)
- Real-time scraping of scheme rules — scheme data is sourced and encoded
  manually for the prototype, not pulled live
- Replacing the bank/CSC officer — this builds a case for a conversation,
  not a loan-approval decision

## Success criteria for the SIH prototype

- Financial engine produces exact, correct scheme routing and EMI figures
  for at least one real Sonbhadra example (SC and ST paths both testable)
- Feasibility report is grounded in real Sonbhadra data for at least 1–2
  hand-checked villages, not fabricated numbers
- A judge can go from language selection to final "show this to the bank"
  screen without needing anything explained to them

