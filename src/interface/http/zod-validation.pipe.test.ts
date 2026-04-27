import { z } from 'zod';
import { ValidationError } from '../../domain/errors.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const schema = z.object({ name: z.string().min(1) });
  const pipe = new ZodValidationPipe(schema);

  it('returns the parsed value on success', () => {
    expect(pipe.transform({ name: 'a' })).toEqual({ name: 'a' });
  });

  it('throws a ValidationError when parsing fails', () => {
    expect(() => pipe.transform({ name: '' })).toThrow(ValidationError);
  });

  it('throws a ValidationError on completely invalid shapes', () => {
    expect(() => pipe.transform(42)).toThrow(ValidationError);
  });

  it('falls back to a default message when the schema returns no issues', () => {
    const fakeSchema = {
      safeParse: (): { success: false; error: { issues: never[] } } => ({
        success: false,
        error: { issues: [] },
      }),
    } as unknown as z.ZodType<{ name: string }>;
    const fallbackPipe = new ZodValidationPipe(fakeSchema);
    expect(() => fallbackPipe.transform({})).toThrow('invalid input');
  });
});
