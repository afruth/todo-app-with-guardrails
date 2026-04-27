import { DomainError, NotFoundError } from '../../domain/errors.js';
import type {
  OrganizationId,
  TagId,
  TodoId,
  UserId,
} from '../../domain/ids.js';
import { normalizeDeadline, normalizeTitle, type Todo } from '../../domain/todo.js';
import type { Clock } from '../ports/clock.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { GetOrCreateTag } from './get-or-create-tag.js';
import type { MembershipGuard } from './membership-guard.js';

export interface UpdateTodoInput {
  readonly title?: string | undefined;
  readonly deadlineAt?: string | null | undefined;
  readonly isCompleted?: boolean | undefined;
  readonly tagNames?: readonly string[] | undefined;
}

export interface UpdateTodoDeps {
  readonly todos: TodoRepository;
  readonly projects: ProjectRepository;
  readonly tags: GetOrCreateTag;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
}

export class UpdateTodo {
  constructor(private readonly deps: UpdateTodoDeps) {}

  async execute(
    userId: UserId,
    todoId: TodoId,
    input: UpdateTodoInput,
  ): Promise<TodoWithTags> {
    const existing = await this.deps.todos.findById(todoId);
    if (existing === null) {
      throw new NotFoundError('todo not found');
    }
    await this.deps.guard.assertMember(userId, existing.organizationId);
    const next = this.applyChanges(existing, input);
    const tagIds = input.tagNames === undefined
      ? existing.tagIds
      : await this.resolveTagIds(existing.organizationId, input.tagNames);
    await this.deps.todos.update(next, tagIds);
    return this.reload(next.id);
  }

  private async reload(todoId: TodoId): Promise<TodoWithTags> {
    const reloaded = await this.deps.todos.findById(todoId);
    /* istanbul ignore if -- @preserve: invariant — the todo was just updated in this process */
    if (reloaded === null) {
      throw new DomainError('todo disappeared between update and reload');
    }
    return reloaded;
  }

  private applyChanges(existing: Todo, input: UpdateTodoInput): Todo {
    const title = input.title === undefined ? existing.title : normalizeTitle(input.title);
    const deadlineAt =
      input.deadlineAt === undefined ? existing.deadlineAt : normalizeDeadline(input.deadlineAt);
    const isCompleted = input.isCompleted ?? existing.isCompleted;
    return {
      ...existing,
      title,
      deadlineAt,
      isCompleted,
      updatedAt: this.deps.clock.nowIso(),
    };
  }

  private async resolveTagIds(
    organizationId: OrganizationId,
    names: readonly string[],
  ): Promise<readonly TagId[]> {
    const out: TagId[] = [];
    for (const raw of names) {
      const tag = await this.deps.tags.execute(organizationId, raw);
      if (!out.includes(tag.id)) {
        out.push(tag.id);
      }
    }
    return out;
  }
}
