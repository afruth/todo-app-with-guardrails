import { NotFoundError } from '../../domain/errors.js';
import {
  asTodoId,
  type OrganizationId,
  type ProjectId,
  type TagId,
  type UserId,
} from '../../domain/ids.js';
import { normalizeDeadline, normalizeTitle, type Todo } from '../../domain/todo.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { GetOrCreateTag } from './get-or-create-tag.js';
import type { MembershipGuard } from './membership-guard.js';

export interface CreateTodoInput {
  readonly title: string;
  readonly deadlineAt?: string | null | undefined;
  readonly tagNames?: readonly string[] | undefined;
}

export interface CreateTodoDeps {
  readonly todos: TodoRepository;
  readonly projects: ProjectRepository;
  readonly tags: GetOrCreateTag;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export class CreateTodo {
  constructor(private readonly deps: CreateTodoDeps) {}

  async execute(
    userId: UserId,
    projectId: ProjectId,
    input: CreateTodoInput,
  ): Promise<TodoWithTags> {
    const project = await this.deps.projects.findById(projectId);
    if (project === null) {
      throw new NotFoundError('project not found');
    }
    await this.deps.guard.assertMember(userId, project.organizationId);
    const title = normalizeTitle(input.title);
    const deadlineAt = normalizeDeadline(input.deadlineAt);
    const tagIds = await this.resolveTagIds(project.organizationId, input.tagNames ?? []);
    const now = this.deps.clock.nowIso();
    const todo: Todo = {
      id: asTodoId(this.deps.ids.next()),
      projectId,
      title,
      isCompleted: false,
      deadlineAt,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.todos.insert(todo, tagIds);
    const found = await this.deps.todos.findById(todo.id);
    /* istanbul ignore if -- @preserve: invariant — the todo was just inserted in this process */
    if (found === null) {
      throw new Error('todo disappeared after insert');
    }
    return found;
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
