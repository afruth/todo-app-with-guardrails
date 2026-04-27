import { asc, eq } from 'drizzle-orm';
import type { InviteRepository } from '../../application/ports/invite-repository.js';
import {
  asInviteId,
  asOrganizationId,
  asUserId,
  type InviteId,
  type OrganizationId,
} from '../../domain/ids.js';
import type { Invite } from '../../domain/invite.js';
import type { OrganizationRole } from '../../domain/organization.js';
import type { Db } from './database.js';
import { organizationInvites } from './schema/organization-invites.js';

interface Row {
  readonly id: string;
  readonly organizationId: string;
  readonly token: string;
  readonly emailHint: string | null;
  readonly role: OrganizationRole;
  readonly createdByUserId: string;
  readonly acceptedByUserId: string | null;
  readonly acceptedAt: string | null;
  readonly revokedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toInvite = (row: Row): Invite => ({
  id: asInviteId(row.id),
  organizationId: asOrganizationId(row.organizationId),
  token: row.token,
  emailHint: row.emailHint,
  role: row.role,
  createdByUserId: asUserId(row.createdByUserId),
  acceptedByUserId: row.acceptedByUserId === null ? null : asUserId(row.acceptedByUserId),
  acceptedAt: row.acceptedAt,
  revokedAt: row.revokedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class DrizzleInviteRepository implements InviteRepository {
  constructor(private readonly db: Db) {}

  async insert(invite: Invite): Promise<void> {
    await this.db.insert(organizationInvites).values({
      id: invite.id,
      organizationId: invite.organizationId,
      token: invite.token,
      emailHint: invite.emailHint,
      role: invite.role,
      createdByUserId: invite.createdByUserId,
      acceptedByUserId: invite.acceptedByUserId,
      acceptedAt: invite.acceptedAt,
      revokedAt: invite.revokedAt,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    });
  }

  async update(invite: Invite): Promise<void> {
    await this.db
      .update(organizationInvites)
      .set({
        emailHint: invite.emailHint,
        role: invite.role,
        acceptedByUserId: invite.acceptedByUserId,
        acceptedAt: invite.acceptedAt,
        revokedAt: invite.revokedAt,
        updatedAt: invite.updatedAt,
      })
      .where(eq(organizationInvites.id, invite.id));
  }

  async findById(id: InviteId): Promise<Invite | null> {
    const rows = await this.db
      .select()
      .from(organizationInvites)
      .where(eq(organizationInvites.id, id))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toInvite(row);
  }

  async findByToken(token: string): Promise<Invite | null> {
    const rows = await this.db
      .select()
      .from(organizationInvites)
      .where(eq(organizationInvites.token, token))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toInvite(row);
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Invite[]> {
    const rows = await this.db
      .select()
      .from(organizationInvites)
      .where(eq(organizationInvites.organizationId, organizationId))
      .orderBy(asc(organizationInvites.createdAt));
    return rows.map(toInvite);
  }
}
