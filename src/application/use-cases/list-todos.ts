import type {
  OrganizationId,
  ProjectId,
  UserId,
} from '../../domain/ids.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface ListTodosInput {
  readonly projectId?: ProjectId | undefined;
}

export interface ListTodosDeps {
  readonly todos: TodoRepository;
  readonly guard: MembershipGuard;
}

export class ListTodos {
  constructor(private readonly deps: ListTodosDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
    input: ListTodosInput = {},
  ): Promise<readonly TodoWithTags[]> {
    await this.deps.guard.assertMember(userId, organizationId);
    return this.deps.todos.list({
      organizationId,
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
    });
  }
}
