import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.ts';
import { authRoutes } from './routes/auth.ts';
import { villageRoutes } from './routes/villages.ts';
import { onboardingRoutes } from './routes/onboarding.ts';
import { applicationRoutes } from './routes/applications.ts';

export async function buildServer(): Promise<FastifyInstance> {
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

  return app;
}
