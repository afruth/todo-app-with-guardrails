import { ConflictError, NotFoundError } from '../../domain/errors.js';
import type { ProjectId, UserId } from '../../domain/ids.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type { TodoRepository } from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface DeleteProjectDeps {
  readonly projects: ProjectRepository;
  readonly todos: TodoRepository;
  readonly guard: MembershipGuard;
}

export class DeleteProject {
  constructor(private readonly deps: DeleteProjectDeps) {}

  async execute(userId: UserId, projectId: ProjectId): Promise<void> {
    const existing = await this.deps.projects.findById(projectId);
    if (existing === null) {
      throw new NotFoundError('project not found');
    }
    await this.deps.guard.assertOwner(userId, existing.organizationId);
    const todos = await this.deps.todos.list({
      organizationId: existing.organizationId,
      projectId,
    });
    if (todos.length > 0) {
      throw new ConflictError('cannot delete a project that still contains todos');
    }
    await this.deps.projects.delete(projectId);
  }
}
