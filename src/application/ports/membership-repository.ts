import type { Membership } from '../../domain/membership.js';
import type {
  MembershipId,
  OrganizationId,
  UserId,
} from '../../domain/ids.js';

export interface MembershipWithOrgName extends Membership {
  readonly organizationName: string;
  readonly organizationLogoPath: string | null;
}

export interface MembershipWithUserEmail extends Membership {
  readonly userEmail: string;
}

export interface MembershipRepository {
  insert(membership: Membership): Promise<void>;
  delete(id: MembershipId): Promise<boolean>;
  findById(id: MembershipId): Promise<Membership | null>;
  findByUserAndOrg(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Membership | null>;
  listForUser(userId: UserId): Promise<readonly MembershipWithOrgName[]>;
  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly MembershipWithUserEmail[]>;
  countOwners(organizationId: OrganizationId): Promise<number>;
}
