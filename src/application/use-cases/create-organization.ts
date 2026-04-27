import {
  asMembershipId,
  asOrganizationId,
  asProjectId,
  type UserId,
} from '../../domain/ids.js';
import type { Membership } from '../../domain/membership.js';
import {
  normalizeOrganizationName,
  type Organization,
} from '../../domain/organization.js';
import type { Project } from '../../domain/project.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { MembershipRepository } from '../ports/membership-repository.js';
import type { OrganizationRepository } from '../ports/organization-repository.js';
import type { ProjectRepository } from '../ports/project-repository.js';

export interface CreateOrganizationDeps {
  readonly organizations: OrganizationRepository;
  readonly memberships: MembershipRepository;
  readonly projects: ProjectRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export interface CreateOrganizationResult {
  readonly organization: Organization;
  readonly inboxProject: Project;
}

const INBOX_PROJECT_NAME = 'Inbox';

export class CreateOrganization {
  constructor(private readonly deps: CreateOrganizationDeps) {}

  async execute(userId: UserId, rawName: string): Promise<CreateOrganizationResult> {
    const name = normalizeOrganizationName(rawName);
    const now = this.deps.clock.nowIso();
    const organization: Organization = {
      id: asOrganizationId(this.deps.ids.next()),
      name,
      logoPath: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.organizations.insert(organization);
    const membership: Membership = {
      id: asMembershipId(this.deps.ids.next()),
      organizationId: organization.id,
      userId,
      role: 'owner',
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.memberships.insert(membership);
    const inboxProject: Project = {
      id: asProjectId(this.deps.ids.next()),
      organizationId: organization.id,
      name: INBOX_PROJECT_NAME,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.projects.insert(inboxProject);
    return { organization, inboxProject };
  }
}
