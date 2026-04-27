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
