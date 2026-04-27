import { UnauthorizedError } from '../../domain/errors.js';
import { FakeTokenSigner } from '../../../tests/doubles/fake-token-signer.js';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.js';

interface FakeRequest {
  cookies?: Record<string, string>;
  authorization?: string;
  userId?: string;
}

const makeContext = (req: FakeRequest): {
  switchToHttp: () => { getRequest: () => unknown };
} => ({
  switchToHttp: (): { getRequest: () => unknown } => ({
    getRequest: (): unknown => ({
      ...req,
      header: (name: string): string | undefined => {
        if (name === 'authorization') {
          return req.authorization;
        }
        return undefined;
      },
    }),
  }),
});

describe('AuthGuard', () => {
  const guard = new AuthGuard(new FakeTokenSigner());

  it('accepts a token from the session cookie', async () => {
    const req: FakeRequest = { cookies: { todo_session: 'token:u-1' } };
    const ctx = makeContext(req);
    await expect(guard.canActivate(ctx as never)).resolves.toBe(true);
  });

  it('accepts a token from the Authorization header', async () => {
    const req: FakeRequest = { authorization: 'Bearer token:u-2' };
    const ctx = makeContext(req);
    const ok = await guard.canActivate(ctx as never);
    expect(ok).toBe(true);
  });

  it('attaches the user id to the request', async () => {
    const target = {
      cookies: { todo_session: 'token:u-7' },
      header: (): undefined => undefined,
    };
    const ctx = {
      switchToHttp: (): { getRequest: () => unknown } => ({
        getRequest: (): unknown => target,
      }),
    };
    await guard.canActivate(ctx as never);
    expect((target as unknown as AuthenticatedRequest).userId).toBe('u-7');
  });

  it('rejects when no token is present', async () => {
    const req: FakeRequest = {};
    const ctx = makeContext(req);
    await expect(guard.canActivate(ctx as never)).rejects.toThrow(UnauthorizedError);
  });

  it('rejects when the token is invalid', async () => {
    const req: FakeRequest = { cookies: { todo_session: 'invalid' } };
    const ctx = makeContext(req);
    await expect(guard.canActivate(ctx as never)).rejects.toThrow(UnauthorizedError);
  });
});
