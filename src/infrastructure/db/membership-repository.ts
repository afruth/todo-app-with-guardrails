import { and, asc, count, eq } from 'drizzle-orm';
import type {
  MembershipRepository,
  MembershipWithOrgName,
  MembershipWithUserEmail,
} from '../../application/ports/membership-repository.js';
import {
  asMembershipId,
  asOrganizationId,
  asUserId,
  type MembershipId,
  type OrganizationId,
  type UserId,
} from '../../domain/ids.js';
import type { Membership } from '../../domain/membership.js';
import type { OrganizationRole } from '../../domain/organization.js';
import type { Db } from './database.js';
import { organizationMembers } from './schema/organization-members.js';
import { organizations } from './schema/organizations.js';
import { users } from './schema/users.js';

interface MemberRow {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: OrganizationRole;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toMembership = (row: MemberRow): Membership => ({
  id: asMembershipId(row.id),
  organizationId: asOrganizationId(row.organizationId),
  userId: asUserId(row.userId),
  role: row.role,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class DrizzleMembershipRepository implements MembershipRepository {
  constructor(private readonly db: Db) {}

  async insert(membership: Membership): Promise<void> {
    await this.db.insert(organizationMembers).values({
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    });
  }

  async delete(id: MembershipId): Promise<boolean> {
    const result = await this.db
      .delete(organizationMembers)
      .where(eq(organizationMembers.id, id));
    return result.changes > 0;
  }

  async findById(id: MembershipId): Promise<Membership | null> {
    const rows = await this.db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, id))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toMembership(row);
  }

  async findByUserAndOrg(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Membership | null> {
    const rows = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toMembership(row);
  }

  async listForUser(userId: UserId): Promise<readonly MembershipWithOrgName[]> {
    const rows = await this.db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
        updatedAt: organizationMembers.updatedAt,
        organizationName: organizations.name,
        organizationLogoPath: organizations.logoPath,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .orderBy(asc(organizations.name));
    return rows.map((r) => ({
      ...toMembership(r),
      organizationName: r.organizationName,
      organizationLogoPath: r.organizationLogoPath,
    }));
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly MembershipWithUserEmail[]> {
    const rows = await this.db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        createdAt: organizationMembers.createdAt,
        updatedAt: organizationMembers.updatedAt,
        userEmail: users.email,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, organizationId))
      .orderBy(asc(users.email));
    return rows.map((r) => ({ ...toMembership(r), userEmail: r.userEmail }));
  }

  async countOwners(organizationId: OrganizationId): Promise<number> {
    const rows = await this.db
      .select({ n: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, 'owner'),
        ),
      );
    return rows[0]?.n ?? 0;
  }
}
