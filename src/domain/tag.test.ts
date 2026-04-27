import { ValidationError } from './errors.js';
import { normalizeTagName } from './tag.js';

describe('normalizeTagName', () => {
  it('lowercases and trims a valid tag', () => {
    expect(normalizeTagName('  Work  ')).toBe('work');
  });

  it('accepts tags with hyphens', () => {
    expect(normalizeTagName('side-project')).toBe('side-project');
  });

  it('accepts tags with digits', () => {
    expect(normalizeTagName('q1-2026')).toBe('q1-2026');
  });

  it('rejects an empty tag', () => {
    expect(() => normalizeTagName('   ')).toThrow(ValidationError);
  });

  it('rejects a tag longer than 40 characters', () => {
    expect(() => normalizeTagName('a'.repeat(41))).toThrow(ValidationError);
  });

  it('rejects a tag with spaces', () => {
    expect(() => normalizeTagName('two words')).toThrow(ValidationError);
  });

  it('rejects a tag starting with a hyphen', () => {
    expect(() => normalizeTagName('-leading')).toThrow(ValidationError);
  });

  it('rejects a tag with non-ASCII characters', () => {
    expect(() => normalizeTagName('café')).toThrow(ValidationError);
  });
});
