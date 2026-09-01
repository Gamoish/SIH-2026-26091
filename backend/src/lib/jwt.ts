import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.ts';

const key = new TextEncoder().encode(env.jwtSecret);

export type SessionClaims = { userId: string; phone: string };

export async function issueToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ phone: claims.phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuer(env.jwtIssuer)
    .setAudience(env.jwtIssuer)
    .setIssuedAt()
    .setExpirationTime(`${env.jwtTtlSeconds}s`)
    .sign(key);
}

/** Returns the claims, or null for anything not a currently valid token. */
export async function readToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: env.jwtIssuer,
      audience: env.jwtIssuer,
      algorithms: ['HS256'], // pinned: never let the token pick its own algorithm
    });
    if (!payload.sub || typeof payload.phone !== 'string') return null;
    return { userId: payload.sub, phone: payload.phone };
  } catch {
    return null;
  }
}
