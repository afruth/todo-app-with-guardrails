import { BcryptPasswordHasher } from './password-hasher.js';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(4);

  it('hash produces a non-empty string different from the plaintext', async () => {
    const result = await hasher.hash('secret');
    expect(result.length).toBeGreaterThan(10);
    expect(result).not.toBe('secret');
  });

  it('verify returns true for the matching plaintext', async () => {
    const hash = await hasher.hash('secret');
    expect(await hasher.verify('secret', hash)).toBe(true);
  });

  it('verify returns false for a non-matching plaintext', async () => {
    const hash = await hasher.hash('secret');
    expect(await hasher.verify('not-secret', hash)).toBe(false);
  });

  it('uses the default cost factor when no argument is passed', async () => {
    const defaultHasher = new BcryptPasswordHasher();
    const hash = await defaultHasher.hash('secret');
    expect(await defaultHasher.verify('secret', hash)).toBe(true);
  }, 15000);
});
