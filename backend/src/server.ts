/**
 * Vercel's entrypoint.
 *
 * Vercel deploys a Node server with zero configuration: it looks for
 * `server.ts` (or `index`/`app`) at the project root or under `src/`, and
 * captures the `listen()` call made during module startup, routing requests to
 * it through an internal port. No adapter, no handler export, no vercel.json.
 *
 * So this file is deliberately a one-line re-export rather than a second copy
 * of the bootstrap: `index.ts` already calls `app.listen()`, and it stays the
 * entrypoint for `pnpm dev`, `pnpm start`, Docker and Playwright. This exists
 * only because `server` is the filename Vercel's detection agrees on, and
 * renaming index.ts would churn all four of those call sites for nothing.
 */
import './index.ts';
