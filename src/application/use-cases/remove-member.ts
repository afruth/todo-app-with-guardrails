import { ConflictError, NotFoundError } from '../../domain/errors.js';
import type { MembershipId, OrganizationId, UserId } from '../../domain/ids.js';
import { isOwner } from '../../domain/organization.js';
import type { MembershipRepository } from '../ports/membership-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface RemoveMemberDeps {
  readonly memberships: MembershipRepository;
  readonly guard: MembershipGuard;
}

export class RemoveMember {
  constructor(private readonly deps: RemoveMemberDeps) {}

  async execute(
    actorUserId: UserId,
    organizationId: OrganizationId,
    membershipId: MembershipId,
  ): Promise<void> {
    await this.deps.guard.assertOwner(actorUserId, organizationId);
    const target = await this.deps.memberships.findById(membershipId);
    if (target?.organizationId !== organizationId) {
      throw new NotFoundError('membership not found');
    }
    if (isOwner(target.role)) {
      const owners = await this.deps.memberships.countOwners(organizationId);
      if (owners <= 1) {
        throw new ConflictError('cannot remove the last owner');
      }
    }
    await this.deps.memberships.delete(membershipId);
  }
}
