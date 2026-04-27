import type { Clock } from '../../src/application/ports/clock.js';

export class FakeClock implements Clock {
  private current: string;

  constructor(initial: string) {
    this.current = initial;
  }

  set(iso: string): void {
    this.current = iso;
  }

  nowIso(): string {
    return this.current;
  }
}
