import type { FastifyReply, FastifyRequest } from 'fastify';
import { readToken, type SessionClaims } from '../lib/jwt.ts';

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionClaims;
  }
}

/**
 * The single place a request becomes "authenticated". The user id comes from
 * the signed token and nowhere else - a user_id in a body, query or header is
 * never read, so one account can never write another account's rows.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const claims = token ? await readToken(token) : null;

  if (!claims) {
    await reply.code(401).send({ error: 'unauthenticated' });
    return;
  }
  req.user = claims;
}

/** Narrow `req.user` after requireAuth has run. */
export function authed(req: FastifyRequest): SessionClaims {
  if (!req.user) throw new Error('route is missing the requireAuth preHandler');
  return req.user;
}
