import { ForbiddenError } from '../../domain/errors.js';
import type { OrganizationId, UserId } from '../../domain/ids.js';
import type { Membership } from '../../domain/membership.js';
import { isOwner } from '../../domain/organization.js';
import type { MembershipRepository } from '../ports/membership-repository.js';

export class MembershipGuard {
  constructor(private readonly memberships: MembershipRepository) {}

  async assertMember(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Membership> {
    const m = await this.memberships.findByUserAndOrg(userId, organizationId);
    if (m === null) {
      throw new ForbiddenError('not a member of this organization');
    }
    return m;
  }

  async assertOwner(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Membership> {
    const m = await this.assertMember(userId, organizationId);
    if (!isOwner(m.role)) {
      throw new ForbiddenError('only an owner can perform this action');
    }
    return m;
  }
}
