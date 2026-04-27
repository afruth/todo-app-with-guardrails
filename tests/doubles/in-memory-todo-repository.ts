import type {
  ListByTagArgs,
  ListTodosArgs,
  ListUpcomingArgs,
  TodoRepository,
  TodoWithTags,
} from '../../src/application/ports/todo-repository.js';
import type {
  OrganizationId,
  ProjectId,
  TagId,
  TodoId,
} from '../../src/domain/ids.js';
import type { Todo } from '../../src/domain/todo.js';
import type { InMemoryProjectRepository } from './in-memory-project-repository.js';
import type { InMemoryTagRepository } from './in-memory-tag-repository.js';

interface Stored {
  readonly todo: Todo;
  readonly tagIds: readonly TagId[];
}

export class InMemoryTodoRepository implements TodoRepository {
  private readonly items = new Map<TodoId, Stored>();

  constructor(
    private readonly projects: InMemoryProjectRepository,
    private readonly tags: InMemoryTagRepository,
  ) {}

  insert(todo: Todo, tagIds: readonly TagId[]): Promise<void> {
    this.items.set(todo.id, { todo, tagIds: [...tagIds] });
    return Promise.resolve();
  }

  update(todo: Todo, tagIds: readonly TagId[]): Promise<void> {
    return this.insert(todo, tagIds);
  }

  delete(id: TodoId): Promise<boolean> {
    return Promise.resolve(this.items.delete(id));
  }

  async findById(id: TodoId): Promise<TodoWithTags | null> {
    const stored = this.items.get(id);
    if (stored === undefined) {
      return null;
    }
    return this.hydrate(stored);
  }

  async list(args: ListTodosArgs): Promise<readonly TodoWithTags[]> {
    const matching = await this.matchingForOrg(args.organizationId, args.projectId);
    return this.hydrateAll(matching);
  }

  async listUpcoming(args: ListUpcomingArgs): Promise<readonly TodoWithTags[]> {
    const owned = await this.matchingForOrg(args.organizationId);
    const filtered = owned.filter((s) => {
      const { deadlineAt, isCompleted } = s.todo;
      return !isCompleted && deadlineAt !== null && deadlineAt >= args.fromIso;
    });
    filtered.sort((a, b) =>
      (a.todo.deadlineAt ?? '').localeCompare(b.todo.deadlineAt ?? ''),
    );
    return this.hydrateAll(filtered.slice(0, args.limit));
  }

  async listByTag(args: ListByTagArgs): Promise<readonly TodoWithTags[]> {
    const owned = await this.matchingForOrg(args.organizationId);
    const filtered = owned.filter((s) => s.tagIds.includes(args.tagId));
    return this.hydrateAll(filtered);
  }

  private async matchingForOrg(
    organizationId: OrganizationId,
    projectFilter?: ProjectId,
  ): Promise<Stored[]> {
    const out: Stored[] = [];
    for (const stored of this.items.values()) {
      const project = await this.projects.findById(stored.todo.projectId);
      if (project?.organizationId !== organizationId) {
        continue;
      }
      if (projectFilter !== undefined && project.id !== projectFilter) {
        continue;
      }
      out.push(stored);
    }
    return out;
  }

  private async hydrate(stored: Stored): Promise<TodoWithTags> {
    const project = await this.projects.findById(stored.todo.projectId);
    const tagNames: string[] = [];
    for (const tagId of stored.tagIds) {
      const tag = await this.tags.findById(tagId);
      if (tag !== null) {
        tagNames.push(tag.name);
      }
    }
    return {
      ...stored.todo,
      organizationId: project === null
        ? ('' as OrganizationId)
        : project.organizationId,
      tagIds: stored.tagIds,
      tagNames,
    };
  }

  private async hydrateAll(stored: readonly Stored[]): Promise<readonly TodoWithTags[]> {
    const out: TodoWithTags[] = [];
    for (const item of stored) {
      out.push(await this.hydrate(item));
    }
    return out;
  }
}
