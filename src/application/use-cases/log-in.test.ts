import { UnauthorizedError } from '../../domain/errors.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('LogIn', () => {
  it('returns a token on successful login', async () => {
    const stack = buildAppStack();
    await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const result = await stack.logIn.execute({ email: 'a@b.co', password: 'password123' });
    expect(result.token).toMatch(/^token:/);
  });

  it('rejects an unknown email', async () => {
    const stack = buildAppStack();
    await expect(
      stack.logIn.execute({ email: 'nobody@x.co', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('rejects an incorrect password', async () => {
    const stack = buildAppStack();
    await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    await expect(
      stack.logIn.execute({ email: 'a@b.co', password: 'wrong-pwd' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
