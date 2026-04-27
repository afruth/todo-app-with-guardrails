import type {
  OrganizationId,
  ProjectId,
  TagId,
  TodoId,
} from '../../domain/ids.js';
import type { Todo } from '../../domain/todo.js';

export interface TodoWithTags extends Todo {
  readonly organizationId: OrganizationId;
  readonly tagIds: readonly TagId[];
  readonly tagNames: readonly string[];
}

export interface ListUpcomingArgs {
  readonly organizationId: OrganizationId;
  readonly fromIso: string;
  readonly limit: number;
}

export interface ListByTagArgs {
  readonly organizationId: OrganizationId;
  readonly tagId: TagId;
}

export interface ListTodosArgs {
  readonly organizationId: OrganizationId;
  readonly projectId?: ProjectId | undefined;
}

export interface TodoRepository {
  insert(todo: Todo, tagIds: readonly TagId[]): Promise<void>;
  update(todo: Todo, tagIds: readonly TagId[]): Promise<void>;
  delete(id: TodoId): Promise<boolean>;
  findById(id: TodoId): Promise<TodoWithTags | null>;
  list(args: ListTodosArgs): Promise<readonly TodoWithTags[]>;
  listUpcoming(args: ListUpcomingArgs): Promise<readonly TodoWithTags[]>;
  listByTag(args: ListByTagArgs): Promise<readonly TodoWithTags[]>;
}
