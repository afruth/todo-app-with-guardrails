import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';

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
});
