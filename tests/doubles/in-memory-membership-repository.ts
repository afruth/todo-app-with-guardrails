import type {
  MembershipRepository,
  MembershipWithOrgName,
  MembershipWithUserEmail,
} from '../../src/application/ports/membership-repository.js';
import type {
  MembershipId,
  OrganizationId,
  UserId,
} from '../../src/domain/ids.js';
import type { Membership } from '../../src/domain/membership.js';
import type { InMemoryOrganizationRepository } from './in-memory-organization-repository.js';
import type { InMemoryUserRepository } from './in-memory-user-repository.js';

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly memberships = new Map<MembershipId, Membership>();

  constructor(
    private readonly orgs: InMemoryOrganizationRepository,
    private readonly users: InMemoryUserRepository,
  ) {}

  insert(membership: Membership): Promise<void> {
    this.memberships.set(membership.id, membership);
    return Promise.resolve();
  }

  delete(id: MembershipId): Promise<boolean> {
    return Promise.resolve(this.memberships.delete(id));
  }

  findById(id: MembershipId): Promise<Membership | null> {
    return Promise.resolve(this.memberships.get(id) ?? null);
  }

  findByUserAndOrg(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Membership | null> {
    for (const m of this.memberships.values()) {
      if (m.userId === userId && m.organizationId === organizationId) {
        return Promise.resolve(m);
      }
    }
    return Promise.resolve(null);
  }

  async listForUser(userId: UserId): Promise<readonly MembershipWithOrgName[]> {
    const out: MembershipWithOrgName[] = [];
    for (const m of this.memberships.values()) {
      if (m.userId !== userId) {
        continue;
      }
      const org = await this.orgs.findById(m.organizationId);
      if (org !== null) {
        out.push({ ...m, organizationName: org.name, organizationLogoPath: org.logoPath });
      }
    }
    out.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
    return out;
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly MembershipWithUserEmail[]> {
    const out: MembershipWithUserEmail[] = [];
    for (const m of this.memberships.values()) {
      if (m.organizationId !== organizationId) {
        continue;
      }
      const user = await this.users.findById(m.userId);
      if (user !== null) {
        out.push({ ...m, userEmail: user.email });
      }
    }
    out.sort((a, b) => a.userEmail.localeCompare(b.userEmail));
    return out;
  }

  countOwners(organizationId: OrganizationId): Promise<number> {
    let n = 0;
    for (const m of this.memberships.values()) {
      if (m.organizationId === organizationId && m.role === 'owner') {
        n += 1;
      }
    }
    return Promise.resolve(n);
  }
}
