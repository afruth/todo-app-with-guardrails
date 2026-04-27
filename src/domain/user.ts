import { ValidationError } from './errors.js';
import type { UserId } from './ids.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const normalizeEmail = (raw: string): string => {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) {
    throw new ValidationError('email is required');
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    throw new ValidationError('email is too long');
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new ValidationError('email is not valid');
  }
  return trimmed;
};

export const validatePassword = (raw: string): string => {
  if (raw.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(
      `password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`,
    );
  }
  if (raw.length > MAX_PASSWORD_LENGTH) {
    throw new ValidationError(
      `password must be at most ${String(MAX_PASSWORD_LENGTH)} characters`,
    );
  }
  return raw;
};
