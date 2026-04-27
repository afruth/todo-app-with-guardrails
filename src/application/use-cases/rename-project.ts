import { NotFoundError } from '../../domain/errors.js';
import type { ProjectId, UserId } from '../../domain/ids.js';
import { normalizeProjectName, type Project } from '../../domain/project.js';
import type { Clock } from '../ports/clock.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface RenameProjectDeps {
  readonly projects: ProjectRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
}

export class RenameProject {
  constructor(private readonly deps: RenameProjectDeps) {}

  async execute(
    userId: UserId,
    projectId: ProjectId,
    rawName: string,
  ): Promise<Project> {
    const existing = await this.deps.projects.findById(projectId);
    if (existing === null) {
      throw new NotFoundError('project not found');
    }
    await this.deps.guard.assertMember(userId, existing.organizationId);
    const next: Project = {
      ...existing,
      name: normalizeProjectName(rawName),
      updatedAt: this.deps.clock.nowIso(),
    };
    await this.deps.projects.update(next);
    return next;
  }
}
