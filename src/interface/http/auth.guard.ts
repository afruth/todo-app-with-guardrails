import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { UnauthorizedError } from '../../domain/errors.js';
import type { UserId } from '../../domain/ids.js';
import {
  TOKEN_SIGNER,
  type TokenSignerToken,
} from './tokens.js';

const COOKIE_NAME = 'todo_session';

export interface AuthenticatedRequest extends Request {
  userId: UserId;
}

interface RequestWithCookies extends Request {
  readonly cookies: Record<string, string | undefined>;
}

const extractToken = (req: Request): string | null => {
  const cookies = (req as RequestWithCookies).cookies as
    | Record<string, string | undefined>
    | undefined;
  const fromCookie = cookies === undefined ? undefined : cookies[COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }
  const header = req.header('authorization');
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return null;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SIGNER) private readonly tokens: TokenSignerToken) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (token === null) {
      throw new UnauthorizedError('not authenticated');
    }
    const session = await this.tokens.verify(token);
    (req as AuthenticatedRequest).userId = session.userId;
    return true;
  }
}
