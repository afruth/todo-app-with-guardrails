import type { OrganizationId, UserId } from '../../domain/ids.js';
import type { Tag } from '../../domain/tag.js';
import type { TagRepository } from '../ports/tag-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface ListTagsDeps {
  readonly tags: TagRepository;
  readonly guard: MembershipGuard;
}

export class ListTags {
  constructor(private readonly deps: ListTagsDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<readonly Tag[]> {
    await this.deps.guard.assertMember(userId, organizationId);
    return this.deps.tags.listByOrganization(organizationId);
  }
}
