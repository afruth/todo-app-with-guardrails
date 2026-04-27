import { asTagId, type OrganizationId } from '../../domain/ids.js';
import { normalizeTagName, type Tag } from '../../domain/tag.js';
import type { Clock } from '../ports/clock.js';
import type { IdGenerator } from '../ports/id-generator.js';
import type { TagRepository } from '../ports/tag-repository.js';

export interface GetOrCreateTagDeps {
  readonly tags: TagRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export class GetOrCreateTag {
  constructor(private readonly deps: GetOrCreateTagDeps) {}

  async execute(organizationId: OrganizationId, rawName: string): Promise<Tag> {
    const name = normalizeTagName(rawName);
    const existing = await this.deps.tags.findByName(name, organizationId);
    if (existing !== null) {
      return existing;
    }
    const now = this.deps.clock.nowIso();
    const tag: Tag = {
      id: asTagId(this.deps.ids.next()),
      organizationId,
      name,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.tags.insert(tag);
    return tag;
  }
}
