import { UuidV7Generator } from './id-generator.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('UuidV7Generator', () => {
  it('returns a UUID v7-shaped string', () => {
    const id = new UuidV7Generator().next();
    expect(id).toMatch(UUID_PATTERN);
  });

  it('returns distinct ids on consecutive calls', () => {
    const gen = new UuidV7Generator();
    expect(gen.next()).not.toBe(gen.next());
  });
});
