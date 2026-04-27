import { ValidationError } from './errors.js';
import { asProjectId, asTodoId, asUserId } from './ids.js';
import { markCompleted, normalizeDeadline, normalizeTitle, type Todo } from './todo.js';

describe('normalizeTitle', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeTitle('  buy milk  ')).toBe('buy milk');
  });

  it('rejects an empty title', () => {
    expect(() => normalizeTitle('   ')).toThrow(ValidationError);
  });

  it('rejects a title longer than 200 characters', () => {
    expect(() => normalizeTitle('a'.repeat(201))).toThrow(ValidationError);
  });
});

describe('normalizeDeadline', () => {
  it('returns null for null', () => {
    expect(normalizeDeadline(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(normalizeDeadline(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(normalizeDeadline('')).toBeNull();
  });

  it('parses a valid ISO date', () => {
    expect(normalizeDeadline('2026-04-26T10:00:00Z')).toBe('2026-04-26T10:00:00.000Z');
  });

  it('rejects an unparseable date', () => {
    expect(() => normalizeDeadline('not-a-date')).toThrow(ValidationError);
  });
});

describe('markCompleted', () => {
  it('produces a new todo with the new completion state and updatedAt', () => {
    const todo: Todo = {
      id: asTodoId('t1'),
      projectId: asProjectId('p1'),
      title: 'do thing',
      isCompleted: false,
      deadlineAt: null,
      createdByUserId: asUserId('u1'),
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
    };
    const next = markCompleted(todo, true, '2026-04-26T01:00:00.000Z');
    expect(next).not.toBe(todo);
    expect(next.isCompleted).toBe(true);
    expect(next.updatedAt).toBe('2026-04-26T01:00:00.000Z');
    expect(todo.isCompleted).toBe(false);
  });
});
