import { NotFoundError } from '../../domain/errors.js';
import type { TodoId, UserId } from '../../domain/ids.js';
import type { TodoRepository } from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface DeleteTodoDeps {
  readonly todos: TodoRepository;
  readonly guard: MembershipGuard;
}

export class DeleteTodo {
  constructor(private readonly deps: DeleteTodoDeps) {}

  async execute(userId: UserId, todoId: TodoId): Promise<void> {
    const existing = await this.deps.todos.findById(todoId);
    if (existing === null) {
      throw new NotFoundError('todo not found');
    }
    await this.deps.guard.assertMember(userId, existing.organizationId);
    await this.deps.todos.delete(todoId);
  }
}
