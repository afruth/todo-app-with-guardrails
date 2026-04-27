import { SignJWT } from 'jose';
import { UnauthorizedError } from '../domain/errors.js';
import { asUserId } from '../domain/ids.js';
import { JoseTokenSigner } from './token-signer.js';

const SECRET = 'test-secret-of-sufficient-length';

describe('JoseTokenSigner', () => {
  it('rejects a too-short secret', () => {
    expect(() => new JoseTokenSigner('short')).toThrow();
  });

  it('signs and verifies a token', async () => {
    const signer = new JoseTokenSigner(SECRET);
    const token = await signer.sign({ userId: asUserId('u-1') });
    const verified = await signer.verify(token);
    expect(verified.userId).toBe('u-1');
  });

  it('rejects a tampered token', async () => {
    const signer = new JoseTokenSigner(SECRET);
    const token = await signer.sign({ userId: asUserId('u-1') });
    await expect(signer.verify(`${token}garbage`)).rejects.toThrow(UnauthorizedError);
  });

  it('rejects a token signed with a different secret', async () => {
    const signerA = new JoseTokenSigner(SECRET);
    const signerB = new JoseTokenSigner('a-different-secret-of-length');
    const token = await signerA.sign({ userId: asUserId('u-1') });
    await expect(signerB.verify(token)).rejects.toThrow(UnauthorizedError);
  });

  it('rejects garbage', async () => {
    const signer = new JoseTokenSigner(SECRET);
    await expect(signer.verify('not-a-jwt')).rejects.toThrow(UnauthorizedError);
  });

  it('rejects a token with no sub claim', async () => {
    const signer = new JoseTokenSigner(SECRET);
    const key = new TextEncoder().encode(SECRET);
    const noSubToken = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('todo-app')
      .setAudience('todo-app-web')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);
    await expect(signer.verify(noSubToken)).rejects.toThrow(UnauthorizedError);
  });
});
