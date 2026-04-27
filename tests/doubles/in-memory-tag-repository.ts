import type { TagRepository } from '../../src/application/ports/tag-repository.js';
import type { OrganizationId, TagId } from '../../src/domain/ids.js';
import type { Tag } from '../../src/domain/tag.js';

export class InMemoryTagRepository implements TagRepository {
  private readonly tags = new Map<TagId, Tag>();

  insert(tag: Tag): Promise<void> {
    this.tags.set(tag.id, tag);
    return Promise.resolve();
  }

  findById(id: TagId): Promise<Tag | null> {
    return Promise.resolve(this.tags.get(id) ?? null);
  }

  findByName(name: string, organizationId: OrganizationId): Promise<Tag | null> {
    for (const tag of this.tags.values()) {
      if (tag.organizationId === organizationId && tag.name === name) {
        return Promise.resolve(tag);
      }
    }
    return Promise.resolve(null);
  }

  listByOrganization(organizationId: OrganizationId): Promise<readonly Tag[]> {
    const out: Tag[] = [];
    for (const tag of this.tags.values()) {
      if (tag.organizationId === organizationId) {
        out.push(tag);
      }
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(out);
  }
}
