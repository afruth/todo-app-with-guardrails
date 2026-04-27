import { ValidationError } from './errors.js';
import { normalizeEmail, validatePassword } from './user.js';

describe('normalizeEmail', () => {
  it('trims and lowercases a valid email', () => {
    expect(normalizeEmail('  Foo@Example.COM  ')).toBe('foo@example.com');
  });

  it('rejects an empty email', () => {
    expect(() => normalizeEmail('   ')).toThrow(ValidationError);
  });

  it('rejects an email without @', () => {
    expect(() => normalizeEmail('not-an-email')).toThrow(ValidationError);
  });

  it('rejects an email without a TLD', () => {
    expect(() => normalizeEmail('foo@bar')).toThrow(ValidationError);
  });

  it('rejects an excessively long email', () => {
    const local = 'a'.repeat(250);
    expect(() => normalizeEmail(`${local}@example.com`)).toThrow(
      ValidationError,
    );
  });
});

describe('validatePassword', () => {
  it('accepts an 8-character password', () => {
    expect(validatePassword('abcdefgh')).toBe('abcdefgh');
  });

  it('rejects a password under 8 characters', () => {
    expect(() => validatePassword('short')).toThrow(ValidationError);
  });

  it('rejects a password over 100 characters', () => {
    expect(() => validatePassword('a'.repeat(101))).toThrow(ValidationError);
  });
});
