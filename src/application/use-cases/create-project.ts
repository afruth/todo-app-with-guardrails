import {
  asProjectId,
  type OrganizationId,
  type UserId,
} from '../../domain/ids.js';
import { normalizeProjectName, type Project } from '../../domain/project.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface CreateProjectDeps {
  readonly projects: ProjectRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export class CreateProject {
  constructor(private readonly deps: CreateProjectDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
    rawName: string,
  ): Promise<Project> {
    await this.deps.guard.assertMember(userId, organizationId);
    const name = normalizeProjectName(rawName);
    const now = this.deps.clock.nowIso();
    const project: Project = {
      id: asProjectId(this.deps.ids.next()),
      organizationId,
      name,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.projects.insert(project);
    return project;
  }
}
