import {
  Catch,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ConflictError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/errors.js';

const statusFor = (error: DomainError): number => {
  if (error instanceof ValidationError) {
    return HttpStatus.BAD_REQUEST;
  }
  if (error instanceof UnauthorizedError) {
    return HttpStatus.UNAUTHORIZED;
  }
  if (error instanceof NotFoundError) {
    return HttpStatus.NOT_FOUND;
  }
  if (error instanceof ConflictError) {
    return HttpStatus.CONFLICT;
  }
  return HttpStatus.BAD_REQUEST;
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = statusFor(exception);
    response.status(status).json({
      error: exception.name,
      message: exception.message,
    });
  }
}
