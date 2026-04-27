import { UnauthorizedError } from '../../src/domain/errors.js';
import { asUserId } from '../../src/domain/ids.js';
import type {
  SessionToken,
  TokenSigner,
} from '../../src/application/ports/token-signer.js';

export class FakeTokenSigner implements TokenSigner {
  sign(payload: SessionToken): Promise<string> {
    return Promise.resolve(`token:${payload.userId}`);
  }

  verify(token: string): Promise<SessionToken> {
    const prefix = 'token:';
    if (!token.startsWith(prefix)) {
      return Promise.reject(new UnauthorizedError('invalid token'));
    }
    const id = token.slice(prefix.length);
    if (id.length === 0) {
      return Promise.reject(new UnauthorizedError('invalid token'));
    }
    return Promise.resolve({ userId: asUserId(id) });
  }
}
