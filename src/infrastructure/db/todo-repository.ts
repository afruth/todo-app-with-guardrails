import { and, asc, eq, gte, isNotNull } from 'drizzle-orm';
import type {
  ListByTagArgs,
  ListTodosArgs,
  ListUpcomingArgs,
  TodoRepository,
  TodoWithTags,
} from '../../application/ports/todo-repository.js';
import type { TagId, TodoId } from '../../domain/ids.js';
import type { Todo } from '../../domain/todo.js';
import type { Db } from './database.js';
import { projects } from './schema/projects.js';
import { todoTags } from './schema/todo-tags.js';
import { todos } from './schema/todos.js';
import { hydrateTodos, type TodoRow } from './todo-row-mapper.js';

const TODO_SELECT = {
  id: todos.id,
  projectId: todos.projectId,
  title: todos.title,
  isCompleted: todos.isCompleted,
  deadlineAt: todos.deadlineAt,
  createdByUserId: todos.createdByUserId,
  createdAt: todos.createdAt,
  updatedAt: todos.updatedAt,
  organizationId: projects.organizationId,
} as const;

export class DrizzleTodoRepository implements TodoRepository {
  constructor(private readonly db: Db) {}

  async insert(todo: Todo, tagIds: readonly TagId[]): Promise<void> {
    this.db.transaction((tx) => {
      tx.insert(todos)
        .values({
          id: todo.id,
          projectId: todo.projectId,
          title: todo.title,
          isCompleted: todo.isCompleted,
          deadlineAt: todo.deadlineAt,
          createdByUserId: todo.createdByUserId,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
        })
        .run();
      writeTagLinks(tx, todo.id, tagIds);
    });
    return Promise.resolve();
  }

  async update(todo: Todo, tagIds: readonly TagId[]): Promise<void> {
    this.db.transaction((tx) => {
      tx.update(todos)
        .set({
          projectId: todo.projectId,
          title: todo.title,
          isCompleted: todo.isCompleted,
          deadlineAt: todo.deadlineAt,
          updatedAt: todo.updatedAt,
        })
        .where(eq(todos.id, todo.id))
        .run();
      tx.delete(todoTags).where(eq(todoTags.todoId, todo.id)).run();
      writeTagLinks(tx, todo.id, tagIds);
    });
    return Promise.resolve();
  }

  async delete(id: TodoId): Promise<boolean> {
    const result = await this.db.delete(todos).where(eq(todos.id, id));
    return result.changes > 0;
  }

  async findById(id: TodoId): Promise<TodoWithTags | null> {
    const rows: TodoRow[] = await this.db
      .select(TODO_SELECT)
      .from(todos)
      .innerJoin(projects, eq(todos.projectId, projects.id))
      .where(eq(todos.id, id))
      .limit(1);
    const hydrated = await hydrateTodos(this.db, rows);
    return hydrated[0] ?? null;
  }

  async list(args: ListTodosArgs): Promise<readonly TodoWithTags[]> {
    const conditions = args.projectId === undefined
      ? [eq(projects.organizationId, args.organizationId)]
      : [
          eq(projects.organizationId, args.organizationId),
          eq(todos.projectId, args.projectId),
        ];
    const rows: TodoRow[] = await this.db
      .select(TODO_SELECT)
      .from(todos)
      .innerJoin(projects, eq(todos.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(asc(todos.createdAt));
    return hydrateTodos(this.db, rows);
  }

  async listUpcoming(args: ListUpcomingArgs): Promise<readonly TodoWithTags[]> {
    const rows: TodoRow[] = await this.db
      .select(TODO_SELECT)
      .from(todos)
      .innerJoin(projects, eq(todos.projectId, projects.id))
      .where(
        and(
          eq(projects.organizationId, args.organizationId),
          eq(todos.isCompleted, false),
          isNotNull(todos.deadlineAt),
          gte(todos.deadlineAt, args.fromIso),
        ),
      )
      .orderBy(asc(todos.deadlineAt))
      .limit(args.limit);
    return hydrateTodos(this.db, rows);
  }

  async listByTag(args: ListByTagArgs): Promise<readonly TodoWithTags[]> {
    const rows: TodoRow[] = await this.db
      .select(TODO_SELECT)
      .from(todos)
      .innerJoin(projects, eq(todos.projectId, projects.id))
      .innerJoin(todoTags, eq(todoTags.todoId, todos.id))
      .where(
        and(
          eq(projects.organizationId, args.organizationId),
          eq(todoTags.tagId, args.tagId),
        ),
      )
      .orderBy(asc(todos.createdAt));
    return hydrateTodos(this.db, rows);
  }

  addDependency(dependentId: TodoId, prerequisiteId: TodoId): Promise<void> {
    return Promise.reject(notYetImplemented('addDependency', [dependentId, prerequisiteId]));
  }

  removeDependency(
    dependentId: TodoId,
    prerequisiteId: TodoId,
  ): Promise<boolean> {
    return Promise.reject(
      notYetImplemented('removeDependency', [dependentId, prerequisiteId]),
    );
  }

  findPrerequisites(todoId: TodoId): Promise<readonly TodoId[]> {
    return Promise.reject(notYetImplemented('findPrerequisites', [todoId]));
  }

  findDependents(todoId: TodoId): Promise<readonly TodoId[]> {
    return Promise.reject(notYetImplemented('findDependents', [todoId]));
  }
}

const notYetImplemented = (
  method: string,
  args: readonly TodoId[],
): Error =>
  new Error(
    `DrizzleTodoRepository.${method} not yet implemented (WP4): [${args.join(', ')}]`,
  );

const writeTagLinks = (
  tx: Parameters<Parameters<Db['transaction']>[0]>[0],
  todoId: string,
  tagIds: readonly TagId[],
): void => {
  if (tagIds.length === 0) {
    return;
  }
  tx.insert(todoTags)
    .values(tagIds.map((tagId) => ({ todoId, tagId })))
    .run();
};
