import { z } from 'zod';
import type { TodoWithTags } from '../../../application/ports/todo-repository.js';

export const createTodoSchema = z.object({
  projectId: z.string().min(1),
  title: z.string(),
  deadlineAt: z.string().nullable().optional(),
  tagNames: z.array(z.string()).optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().optional(),
  deadlineAt: z.string().nullable().optional(),
  isCompleted: z.boolean().optional(),
  tagNames: z.array(z.string()).optional(),
});

export const moveTodoSchema = z.object({
  projectId: z.string().min(1),
});

export const listTodosQuerySchema = z.object({
  projectId: z.string().optional(),
});

export const upcomingQuerySchema = z.object({
  limit: z.coerce.number().int().optional(),
});

export type CreateTodoDto = z.infer<typeof createTodoSchema>;
export type UpdateTodoDto = z.infer<typeof updateTodoSchema>;
export type MoveTodoDto = z.infer<typeof moveTodoSchema>;
export type ListTodosQueryDto = z.infer<typeof listTodosQuerySchema>;
export type UpcomingQueryDto = z.infer<typeof upcomingQuerySchema>;

export interface TodoView {
  readonly id: string;
  readonly projectId: string;
  readonly organizationId: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly deadlineAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags: readonly string[];
}

export const toView = (todo: TodoWithTags): TodoView => ({
  id: todo.id,
  projectId: todo.projectId,
  organizationId: todo.organizationId,
  title: todo.title,
  isCompleted: todo.isCompleted,
  deadlineAt: todo.deadlineAt,
  createdAt: todo.createdAt,
  updatedAt: todo.updatedAt,
  tags: todo.tagNames,
});
