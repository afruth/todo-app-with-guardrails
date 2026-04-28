import type { TodoId } from './ids.js';

export class DomainError extends Error {
  public override readonly name: string = 'DomainError';
}

export class ValidationError extends DomainError {
  public override readonly name: string = 'ValidationError';
}

export class NotFoundError extends DomainError {
  public override readonly name: string = 'NotFoundError';
}

export class ConflictError extends DomainError {
  public override readonly name: string = 'ConflictError';
}

export class UnauthorizedError extends DomainError {
  public override readonly name: string = 'UnauthorizedError';
}

export class ForbiddenError extends DomainError {
  public override readonly name: string = 'ForbiddenError';
}

export class DependencyBlocksCloseError extends ConflictError {
  public override readonly name: string = 'DependencyBlocksCloseError';
  public readonly details: {
    readonly blocking: readonly { id: TodoId; title: string }[];
  };

  constructor(
    message: string,
    details: {
      readonly blocking: readonly { id: TodoId; title: string }[];
    },
  ) {
    super(message);
    this.details = details;
  }
}

export class DependencyCycleError extends ConflictError {
  public override readonly name: string = 'DependencyCycleError';
  public readonly details: { readonly cycle: readonly TodoId[] };

  constructor(
    message: string,
    details: { readonly cycle: readonly TodoId[] },
  ) {
    super(message);
    this.details = details;
  }
}

export class DependencySelfError extends ValidationError {
  public override readonly name: string = 'DependencySelfError';
}
