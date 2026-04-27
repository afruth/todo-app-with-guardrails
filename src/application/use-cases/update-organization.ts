import { NotFoundError } from '../../domain/errors.js';
import type { OrganizationId, UserId } from '../../domain/ids.js';
import {
  normalizeOrganizationName,
  type Organization,
} from '../../domain/organization.js';
import type { Clock } from '../ports/clock.js';
import type { OrganizationRepository } from '../ports/organization-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface UpdateOrganizationInput {
  readonly name?: string | undefined;
  readonly logoPath?: string | null | undefined;
}

export interface UpdateOrganizationDeps {
  readonly organizations: OrganizationRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
}

export class UpdateOrganization {
  constructor(private readonly deps: UpdateOrganizationDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    await this.deps.guard.assertOwner(userId, organizationId);
    const existing = await this.deps.organizations.findById(organizationId);
    if (existing === null) {
      throw new NotFoundError('organization not found');
    }
    const next: Organization = {
      ...existing,
      name: input.name === undefined ? existing.name : normalizeOrganizationName(input.name),
      logoPath: input.logoPath === undefined ? existing.logoPath : input.logoPath,
      updatedAt: this.deps.clock.nowIso(),
    };
    await this.deps.organizations.update(next);
    return next;
  }
}
