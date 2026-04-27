import type {
  MembershipId,
  OrganizationId,
  UserId,
} from './ids.js';
import type { OrganizationRole } from './organization.js';

export interface Membership {
  readonly id: MembershipId;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly role: OrganizationRole;
  readonly createdAt: string;
  readonly updatedAt: string;
}
