import type { TokenGenerator } from '../../src/application/ports/token-generator.js';

export class FakeTokenGenerator implements TokenGenerator {
  private index = 0;

  next(): string {
    this.index += 1;
    return `tok-${String(this.index).padStart(40, '0')}`;
  }
}
