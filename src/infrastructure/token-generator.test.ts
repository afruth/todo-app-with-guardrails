import { RandomTokenGenerator } from './token-generator.js';

describe('RandomTokenGenerator', () => {
  it('produces a 64-char hex string', () => {
    const t = new RandomTokenGenerator().next();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces distinct tokens', () => {
    const g = new RandomTokenGenerator();
    expect(g.next()).not.toBe(g.next());
  });
});
