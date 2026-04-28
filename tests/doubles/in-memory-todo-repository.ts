import type {
  DependencySummary,
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
  private readonly edges = new Map<TodoId, Set<TodoId>>();

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
    const removed = this.items.delete(id);
    this.edges.delete(id);
    for (const prerequisites of this.edges.values()) {
      prerequisites.delete(id);
    }
    return Promise.resolve(removed);
  }

  addDependency(
    dependentId: TodoId,
    prerequisiteId: TodoId,
  ): Promise<void> {
    let prerequisites = this.edges.get(dependentId);
    if (prerequisites === undefined) {
      prerequisites = new Set<TodoId>();
      this.edges.set(dependentId, prerequisites);
    }
    prerequisites.add(prerequisiteId);
    return Promise.resolve();
  }

  removeDependency(
    dependentId: TodoId,
    prerequisiteId: TodoId,
  ): Promise<boolean> {
    const prerequisites = this.edges.get(dependentId);
    if (prerequisites === undefined) {
      return Promise.resolve(false);
    }
    return Promise.resolve(prerequisites.delete(prerequisiteId));
  }

  findPrerequisites(todoId: TodoId): Promise<readonly TodoId[]> {
    const prerequisites = this.edges.get(todoId);
    if (prerequisites === undefined) {
      return Promise.resolve([]);
    }
    return Promise.resolve([...prerequisites]);
  }

  findDependents(todoId: TodoId): Promise<readonly TodoId[]> {
    const out: TodoId[] = [];
    for (const [dependentId, prerequisites] of this.edges.entries()) {
      if (prerequisites.has(todoId)) {
        out.push(dependentId);
      }
    }
    return Promise.resolve(out);
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
    const dependencies = this.collectDependencies(stored.todo.id);
    return {
      ...stored.todo,
      organizationId: project === null
        ? ('' as OrganizationId)
        : project.organizationId,
      tagIds: stored.tagIds,
      tagNames,
      dependencies,
      hasOpenPrerequisites: dependencies.some((d) => !d.isCompleted),
    };
  }

  private collectDependencies(todoId: TodoId): readonly DependencySummary[] {
    const prerequisites = this.edges.get(todoId);
    if (prerequisites === undefined) {
      return [];
    }
    const out: DependencySummary[] = [];
    for (const prerequisiteId of prerequisites) {
      const prerequisite = this.items.get(prerequisiteId);
      if (prerequisite === undefined) {
        continue;
      }
      out.push({
        id: prerequisite.todo.id,
        title: prerequisite.todo.title,
        isCompleted: prerequisite.todo.isCompleted,
      });
    }
    return out;
  }

  private async hydrateAll(stored: readonly Stored[]): Promise<readonly TodoWithTags[]> {
    const out: TodoWithTags[] = [];
    for (const item of stored) {
      out.push(await this.hydrate(item));
    }
    return out;
  }
}
