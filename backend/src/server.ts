/**
 * The server entrypoint - for Vercel and for everything else.
 *
 * Vercel deploys a Node server with zero configuration: it looks for
 * `server.ts` (or `index`/`app`) at the project root or under `src/`, and
 * captures the `listen()` call made during module startup, routing requests to
 * it through an internal port. No adapter, no handler export, no vercel.json.
 *
 * Its detection does not follow imports: the candidate file itself has to
 * import `fastify`, and exactly one candidate may do so. So the app is
 * constructed here rather than behind a `buildServer()` in another module,
 * and this is the only `server`/`index`/`app` file under `src/`.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.ts';
import { pool } from './db.ts';
import { authRoutes } from './routes/auth.ts';
import { villageRoutes } from './routes/villages.ts';
import { onboardingRoutes } from './routes/onboarding.ts';
import { applicationRoutes } from './routes/applications.ts';

const app = Fastify({
  logger: {
    level: env.isProduction ? 'info' : 'debug',
    // the OTP code and the Authorization header must never reach a log sink
    redact: ['req.headers.authorization', 'req.body.code'],
  },
});

// `methods` is not optional in practice: @fastify/cors defaults to
// GET,HEAD,POST, so the browser's preflight refused every PUT and PATCH -
// which is every write the onboarding flow makes. The frontend swallowed the
// resulting network error, so onboarding_profiles simply stayed empty.
app.register(cors, {
  origin: env.corsOrigin,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

app.get('/health', async () => ({ ok: true, env: env.nodeEnv }));

app.register(authRoutes);
app.register(villageRoutes);
app.register(onboardingRoutes);
app.register(applicationRoutes);

/**
 * No `await` above, and the callback form here, both on purpose: this module
 * body must stay synchronous.
 *
 * Vercel's zero-config runtime hooks `listen()` while it evaluates this file,
 * then waits for that call to hand it a server. A top-level `await` splits the
 * body across microtasks, so evaluation returns before `listen()` is reached -
 * the runtime never sees it, the function never reports ready, and every
 * request hangs at "Waiting for response" until it times out as
 * INTERNAL_FUNCTION_INVOCATION_FAILED. That failure logs nothing at all, since
 * nothing actually threw.
 *
 * Dropping the awaits costs nothing: Fastify queues plugins and defers loading
 * them until `listen()`/`ready()` anyway, so registration order is unchanged
 * and a plugin that fails still surfaces as `err` below.
 */
app.listen({ port: env.port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await pool.end();
  });
}
