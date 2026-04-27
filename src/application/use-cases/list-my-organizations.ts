import type { UserId } from '../../domain/ids.js';
import type {
  MembershipRepository,
  MembershipWithOrgName,
} from '../ports/membership-repository.js';

export class ListMyOrganizations {
  constructor(private readonly memberships: MembershipRepository) {}

  execute(userId: UserId): Promise<readonly MembershipWithOrgName[]> {
    return this.memberships.listForUser(userId);
  }
}
