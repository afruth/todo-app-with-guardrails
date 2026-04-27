import { NotFoundError } from '../../domain/errors.js';
import type { TodoId, UserId } from '../../domain/ids.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface GetTodoDeps {
  readonly todos: TodoRepository;
  readonly guard: MembershipGuard;
}

export class GetTodo {
  constructor(private readonly deps: GetTodoDeps) {}

  async execute(userId: UserId, todoId: TodoId): Promise<TodoWithTags> {
    const todo = await this.deps.todos.findById(todoId);
    if (todo === null) {
      throw new NotFoundError('todo not found');
    }
    await this.deps.guard.assertMember(userId, todo.organizationId);
    return todo;
  }
}
