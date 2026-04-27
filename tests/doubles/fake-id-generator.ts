import type { IdGenerator } from '../../src/application/ports/id-generator.js';

export class FakeIdGenerator implements IdGenerator {
  private index = 0;

  constructor(private readonly prefix = 'id') {}

  next(): string {
    this.index += 1;
    return `${this.prefix}-${String(this.index)}`;
  }
}
