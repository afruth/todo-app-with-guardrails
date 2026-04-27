import type { OrganizationId, UserId } from '../../domain/ids.js';
import type { Project } from '../../domain/project.js';
import type { ProjectRepository } from '../ports/project-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface ListProjectsDeps {
  readonly projects: ProjectRepository;
  readonly guard: MembershipGuard;
}

export class ListProjects {
  constructor(private readonly deps: ListProjectsDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<readonly Project[]> {
    await this.deps.guard.assertMember(userId, organizationId);
    return this.deps.projects.listForOrganization(organizationId);
  }
}
