import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors.js';
import {
  asMembershipId,
  type UserId,
} from '../../domain/ids.js';
import { isPending, validateInviteToken } from '../../domain/invite.js';
import type { Membership } from '../../domain/membership.js';
import type { Organization } from '../../domain/organization.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { InviteRepository } from '../ports/invite-repository.js';
import type { MembershipRepository } from '../ports/membership-repository.js';
import type { OrganizationRepository } from '../ports/organization-repository.js';

export interface AcceptInviteDeps {
  readonly invites: InviteRepository;
  readonly memberships: MembershipRepository;
  readonly organizations: OrganizationRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export interface AcceptInviteResult {
  readonly organization: Organization;
  readonly membership: Membership;
}

export class AcceptInvite {
  constructor(private readonly deps: AcceptInviteDeps) {}

  async execute(userId: UserId, rawToken: string): Promise<AcceptInviteResult> {
    const token = validateInviteToken(rawToken);
    const invite = await this.deps.invites.findByToken(token);
    if (invite === null) {
      throw new NotFoundError('invite not found');
    }
    if (!isPending(invite)) {
      throw new ValidationError('invite is no longer valid');
    }
    const existing = await this.deps.memberships.findByUserAndOrg(
      userId,
      invite.organizationId,
    );
    if (existing !== null) {
      throw new ConflictError('already a member of this organization');
    }
    const organization = await this.deps.organizations.findById(invite.organizationId);
    if (organization === null) {
      throw new NotFoundError('organization not found');
    }
    const now = this.deps.clock.nowIso();
    const membership: Membership = {
      id: asMembershipId(this.deps.ids.next()),
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.memberships.insert(membership);
    await this.deps.invites.update({
      ...invite,
      acceptedAt: now,
      acceptedByUserId: userId,
      updatedAt: now,
    });
    return { organization, membership };
  }
}
