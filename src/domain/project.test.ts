import { ValidationError } from './errors.js';
import { normalizeProjectName } from './project.js';

describe('normalizeProjectName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeProjectName('  Inbox  ')).toBe('Inbox');
  });
  it('rejects an empty name', () => {
    expect(() => normalizeProjectName('   ')).toThrow(ValidationError);
  });
  it('rejects an excessively long name', () => {
    expect(() => normalizeProjectName('a'.repeat(101))).toThrow(ValidationError);
  });
});
