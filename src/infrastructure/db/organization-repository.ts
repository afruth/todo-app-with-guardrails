import { eq } from 'drizzle-orm';
import type { OrganizationRepository } from '../../application/ports/organization-repository.js';
import { asOrganizationId, type OrganizationId } from '../../domain/ids.js';
import type { Organization } from '../../domain/organization.js';
import type { Db } from './database.js';
import { organizations } from './schema/organizations.js';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly logoPath: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toOrg = (row: Row): Organization => ({
  id: asOrganizationId(row.id),
  name: row.name,
  logoPath: row.logoPath,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: Db) {}

  async insert(organization: Organization): Promise<void> {
    await this.db.insert(organizations).values({
      id: organization.id,
      name: organization.name,
      logoPath: organization.logoPath,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    });
  }

  async update(organization: Organization): Promise<void> {
    await this.db
      .update(organizations)
      .set({
        name: organization.name,
        logoPath: organization.logoPath,
        updatedAt: organization.updatedAt,
      })
      .where(eq(organizations.id, organization.id));
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const rows = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toOrg(row);
  }
}
