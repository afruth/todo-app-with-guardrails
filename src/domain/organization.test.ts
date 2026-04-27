import { ValidationError } from './errors.js';
import { isOwner, normalizeOrganizationName } from './organization.js';

describe('normalizeOrganizationName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeOrganizationName('  Acme Co  ')).toBe('Acme Co');
  });

  it('rejects an empty name', () => {
    expect(() => normalizeOrganizationName('   ')).toThrow(ValidationError);
  });

  it('rejects an excessively long name', () => {
    expect(() => normalizeOrganizationName('a'.repeat(101))).toThrow(ValidationError);
  });
});

describe('isOwner', () => {
  it('returns true for owner', () => {
    expect(isOwner('owner')).toBe(true);
  });
  it('returns false for member', () => {
    expect(isOwner('member')).toBe(false);
  });
});
