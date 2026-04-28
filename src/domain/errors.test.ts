import {
  ConflictError,
  DependencyBlocksCloseError,
  DependencyCycleError,
  DependencySelfError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';
import { asTodoId } from './ids.js';

describe('domain errors', () => {
  it('DomainError is an Error with the correct name', () => {
    const error = new DomainError('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DomainError');
    expect(error.message).toBe('boom');
  });

  it('ValidationError extends DomainError', () => {
    const error = new ValidationError('bad input');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('ValidationError');
  });

  it('NotFoundError extends DomainError', () => {
    const error = new NotFoundError('missing');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('NotFoundError');
  });

  it('ConflictError extends DomainError', () => {
    const error = new ConflictError('conflict');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('ConflictError');
  });

  it('UnauthorizedError extends DomainError', () => {
    const error = new UnauthorizedError('nope');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('UnauthorizedError');
  });

  it('ForbiddenError extends DomainError', () => {
    const error = new ForbiddenError('not allowed');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('ForbiddenError');
  });

  it('DependencyBlocksCloseError extends ConflictError and carries a single blocker', () => {
    const blocking = [{ id: asTodoId('todo-a'), title: 'Buy milk' }];
    const error = new DependencyBlocksCloseError(
      "Can't close 'B' — it depends on 'Buy milk', which is still open.",
      { blocking },
    );
    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('DependencyBlocksCloseError');
    expect(error.details.blocking).toEqual(blocking);
  });

  it('DependencyBlocksCloseError carries multiple blockers', () => {
    const blocking = [
      { id: asTodoId('todo-a'), title: 'A' },
      { id: asTodoId('todo-b'), title: 'B' },
      { id: asTodoId('todo-c'), title: 'C' },
    ];
    const error = new DependencyBlocksCloseError('blocked', { blocking });
    expect(error.details.blocking).toHaveLength(3);
    expect(error.details.blocking).toEqual(blocking);
  });

  it('DependencyCycleError extends ConflictError and carries the cycle path', () => {
    const cycle = [asTodoId('a'), asTodoId('b'), asTodoId('c'), asTodoId('a')];
    const error = new DependencyCycleError(
      "Adding 'a' as a prerequisite of 'b' would create a cycle: a → b → c → a.",
      { cycle },
    );
    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('DependencyCycleError');
    expect(error.details.cycle).toEqual(cycle);
  });

  it('DependencySelfError extends ValidationError', () => {
    const error = new DependencySelfError('A task cannot depend on itself.');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('DependencySelfError');
    expect(error.message).toBe('A task cannot depend on itself.');
  });
});
