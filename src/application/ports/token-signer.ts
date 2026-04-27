import type { UserId } from '../../domain/ids.js';

export interface SessionToken {
  readonly userId: UserId;
}

export interface TokenSigner {
  sign(payload: SessionToken): Promise<string>;
  verify(token: string): Promise<SessionToken>;
}
