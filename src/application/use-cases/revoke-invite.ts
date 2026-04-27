import { NotFoundError } from '../../domain/errors.js';
import type { InviteId, OrganizationId, UserId } from '../../domain/ids.js';
import type { InviteRepository } from '../ports/invite-repository.js';
import type { Clock } from '../ports/clock.js';
import type { MembershipGuard } from './membership-guard.js';

export interface RevokeInviteDeps {
  readonly invites: InviteRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
}

export class RevokeInvite {
  constructor(private readonly deps: RevokeInviteDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
    inviteId: InviteId,
  ): Promise<void> {
    await this.deps.guard.assertOwner(userId, organizationId);
    const invite = await this.deps.invites.findById(inviteId);
    if (invite?.organizationId !== organizationId) {
      throw new NotFoundError('invite not found');
    }
    if (invite.acceptedAt !== null || invite.revokedAt !== null) {
      return;
    }
    const now = this.deps.clock.nowIso();
    await this.deps.invites.update({
      ...invite,
      revokedAt: now,
      updatedAt: now,
    });
  }
}
