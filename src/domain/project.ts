import { ValidationError } from './errors.js';
import type { OrganizationId, ProjectId } from './ids.js';

const MAX_NAME_LENGTH = 100;

export interface Project {
  readonly id: ProjectId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const normalizeProjectName = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('project name is required');
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ValidationError(
      `project name must be at most ${String(MAX_NAME_LENGTH)} characters`,
    );
  }
  return trimmed;
};
