import { ValidationError } from './errors.js';
import type { OrganizationId, TagId } from './ids.js';

const MAX_TAG_LENGTH = 40;
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export interface Tag {
  readonly id: TagId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const normalizeTagName = (raw: string): string => {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) {
    throw new ValidationError('tag is required');
  }
  if (trimmed.length > MAX_TAG_LENGTH) {
    throw new ValidationError(
      `tag must be at most ${String(MAX_TAG_LENGTH)} characters`,
    );
  }
  if (!TAG_PATTERN.test(trimmed)) {
    throw new ValidationError(
      'tag may only contain lowercase letters, digits and hyphens',
    );
  }
  return trimmed;
};
