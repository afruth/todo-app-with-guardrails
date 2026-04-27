import type { OrganizationId, UserId } from '../../domain/ids.js';
import type {
  MembershipRepository,
  MembershipWithUserEmail,
} from '../ports/membership-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface ListMembersDeps {
  readonly memberships: MembershipRepository;
  readonly guard: MembershipGuard;
}

export class ListMembers {
  constructor(private readonly deps: ListMembersDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<readonly MembershipWithUserEmail[]> {
    await this.deps.guard.assertMember(userId, organizationId);
    return this.deps.memberships.listForOrganization(organizationId);
  }
}
