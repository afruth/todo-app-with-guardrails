import type { OrganizationId, TagId } from '../../domain/ids.js';
import type { Tag } from '../../domain/tag.js';

export interface TagRepository {
  insert(tag: Tag): Promise<void>;
  findById(id: TagId): Promise<Tag | null>;
  findByName(name: string, organizationId: OrganizationId): Promise<Tag | null>;
  listByOrganization(organizationId: OrganizationId): Promise<readonly Tag[]>;
}
