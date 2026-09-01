import { buildServer } from './http.ts';
import { env } from './env.ts';
import { pool } from './db.ts';

const app = await buildServer();

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
