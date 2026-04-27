import { ValidationError } from './errors.js';
import type { ProjectId, TodoId, UserId } from './ids.js';

const MAX_TITLE_LENGTH = 200;

export interface Todo {
  readonly id: TodoId;
  readonly projectId: ProjectId;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly deadlineAt: string | null;
  readonly createdByUserId: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const normalizeTitle = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('title is required');
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(
      `title must be at most ${String(MAX_TITLE_LENGTH)} characters`,
    );
  }
  return trimmed;
};

export const normalizeDeadline = (raw: string | null | undefined): string | null => {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('deadline is not a valid date');
  }
  return parsed.toISOString();
};

export const markCompleted = (todo: Todo, isCompleted: boolean, now: string): Todo => ({
  ...todo,
  isCompleted,
  updatedAt: now,
});
