import { SystemClock } from './clock.js';

describe('SystemClock', () => {
  it('returns an ISO 8601 string', () => {
    const clock = new SystemClock();
    expect(clock.nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('returns a parseable date close to now', () => {
    const clock = new SystemClock();
    const result = clock.nowIso();
    const parsed = new Date(result).getTime();
    expect(Math.abs(Date.now() - parsed)).toBeLessThan(1000);
  });
});
