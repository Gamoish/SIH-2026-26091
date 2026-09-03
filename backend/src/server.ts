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
await app.register(cors, {
  origin: env.corsOrigin,
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

app.get('/health', async () => ({ ok: true, env: env.nodeEnv }));

await app.register(authRoutes);
await app.register(villageRoutes);
await app.register(onboardingRoutes);
await app.register(applicationRoutes);

try {
  await app.listen({ port: env.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await pool.end();
  });
}
