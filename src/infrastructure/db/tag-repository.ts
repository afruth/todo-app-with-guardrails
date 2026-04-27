import { and, asc, eq } from 'drizzle-orm';
import type { TagRepository } from '../../application/ports/tag-repository.js';
import {
  asOrganizationId,
  asTagId,
  type OrganizationId,
  type TagId,
} from '../../domain/ids.js';
import type { Tag } from '../../domain/tag.js';
import type { Db } from './database.js';
import { tags } from './schema/tags.js';

interface TagRow {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toTag = (row: TagRow): Tag => ({
  id: asTagId(row.id),
  organizationId: asOrganizationId(row.organizationId),
  name: row.name,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class DrizzleTagRepository implements TagRepository {
  constructor(private readonly db: Db) {}

  async insert(tag: Tag): Promise<void> {
    await this.db.insert(tags).values({
      id: tag.id,
      organizationId: tag.organizationId,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    });
  }

  async findById(id: TagId): Promise<Tag | null> {
    const rows = await this.db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toTag(row);
  }

  async findByName(name: string, organizationId: OrganizationId): Promise<Tag | null> {
    const rows = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.organizationId, organizationId), eq(tags.name, name)))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toTag(row);
  }

  async listByOrganization(organizationId: OrganizationId): Promise<readonly Tag[]> {
    const rows = await this.db
      .select()
      .from(tags)
      .where(eq(tags.organizationId, organizationId))
      .orderBy(asc(tags.name));
    return rows.map(toTag);
  }
}
