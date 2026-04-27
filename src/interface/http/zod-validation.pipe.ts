import { Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ValidationError } from '../../domain/errors.js';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const message = first === undefined ? 'invalid input' : first.message;
      throw new ValidationError(message);
    }
    return parsed.data;
  }
}
