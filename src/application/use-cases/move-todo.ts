import { ConflictError, NotFoundError } from '../../domain/errors.js';
import type { ProjectId, TodoId, UserId } from '../../domain/ids.js';
import type { Clock } from '../ports/clock.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface MoveTodoDeps {
  readonly todos: TodoRepository;
  readonly projects: ProjectRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
}

export class MoveTodo {
  constructor(private readonly deps: MoveTodoDeps) {}

  async execute(
    userId: UserId,
    todoId: TodoId,
    targetProjectId: ProjectId,
  ): Promise<TodoWithTags> {
    const existing = await this.deps.todos.findById(todoId);
    if (existing === null) {
      throw new NotFoundError('todo not found');
    }
    await this.deps.guard.assertMember(userId, existing.organizationId);
    const target = await this.deps.projects.findById(targetProjectId);
    if (target === null) {
      throw new NotFoundError('target project not found');
    }
    if (target.organizationId !== existing.organizationId) {
      throw new ConflictError('cannot move a todo across organizations');
    }
    const now = this.deps.clock.nowIso();
    await this.deps.todos.update(
      { ...existing, projectId: target.id, updatedAt: now },
      existing.tagIds,
    );
    const reloaded = await this.deps.todos.findById(todoId);
    /* istanbul ignore if -- @preserve: invariant — just moved this todo */
    if (reloaded === null) {
      throw new NotFoundError('todo disappeared after move');
    }
    return reloaded;
  }
}
