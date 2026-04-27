import { ValidationError } from './errors.js';
import type { OrganizationId } from './ids.js';

const MAX_NAME_LENGTH = 100;

export type OrganizationRole = 'owner' | 'member';

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly logoPath: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const normalizeOrganizationName = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('organization name is required');
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ValidationError(
      `organization name must be at most ${String(MAX_NAME_LENGTH)} characters`,
    );
  }
  return trimmed;
};

export const isOwner = (role: OrganizationRole): boolean => role === 'owner';
