import { jwtVerify, SignJWT } from 'jose';
import { UnauthorizedError } from '../domain/errors.js';
import { asUserId } from '../domain/ids.js';
import type {
  SessionToken,
  TokenSigner,
} from '../application/ports/token-signer.js';

const ISSUER = 'todo-app';
const AUDIENCE = 'todo-app-web';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

export class JoseTokenSigner implements TokenSigner {
  private readonly key: Uint8Array;

  constructor(secret: string, private readonly ttlSeconds: number = DEFAULT_TTL_SECONDS) {
    if (secret.length < 16) {
      throw new Error('JWT secret must be at least 16 characters');
    }
    this.key = new TextEncoder().encode(secret);
  }

  sign(payload: SessionToken): Promise<string> {
    return new SignJWT({ sub: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime(`${String(this.ttlSeconds)}s`)
      .sign(this.key);
  }

  async verify(token: string): Promise<SessionToken> {
    try {
      const result = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      const sub = result.payload.sub;
      if (typeof sub !== 'string' || sub.length === 0) {
        throw new UnauthorizedError('invalid token');
      }
      return { userId: asUserId(sub) };
    } catch (cause) {
      if (cause instanceof UnauthorizedError) {
        throw cause;
      }
      throw new UnauthorizedError('invalid token');
    }
  }
}
