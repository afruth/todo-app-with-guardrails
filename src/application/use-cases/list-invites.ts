import type { OrganizationId, UserId } from '../../domain/ids.js';
import type { Invite } from '../../domain/invite.js';
import type { InviteRepository } from '../ports/invite-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface ListInvitesDeps {
  readonly invites: InviteRepository;
  readonly guard: MembershipGuard;
}

export class ListInvites {
  constructor(private readonly deps: ListInvitesDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<readonly Invite[]> {
    await this.deps.guard.assertOwner(userId, organizationId);
    return this.deps.invites.listForOrganization(organizationId);
  }
}
