import { asInviteId, type OrganizationId, type UserId } from '../../domain/ids.js';
import {
  normalizeEmailHint,
  type Invite,
} from '../../domain/invite.js';
import type { OrganizationRole } from '../../domain/organization.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { InviteRepository } from '../ports/invite-repository.js';
import type { TokenGenerator } from '../ports/token-generator.js';
import type { MembershipGuard } from './membership-guard.js';

export interface CreateInviteInput {
  readonly emailHint?: string | null | undefined;
}

export interface CreateInviteDeps {
  readonly invites: InviteRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly tokens: TokenGenerator;
}

export class CreateInvite {
  constructor(private readonly deps: CreateInviteDeps) {}

  async execute(
    actorUserId: UserId,
    organizationId: OrganizationId,
    input: CreateInviteInput = {},
  ): Promise<Invite> {
    await this.deps.guard.assertOwner(actorUserId, organizationId);
    const role: OrganizationRole = 'member';
    const now = this.deps.clock.nowIso();
    const emailHint = normalizeEmailHint(input.emailHint);
    const invite: Invite = {
      id: asInviteId(this.deps.ids.next()),
      organizationId,
      token: this.deps.tokens.next(),
      emailHint,
      role,
      createdByUserId: actorUserId,
      acceptedByUserId: null,
      acceptedAt: null,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.invites.insert(invite);
    return invite;
  }
}
