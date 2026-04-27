import { NotFoundError } from '../../domain/errors.js';
import type { OrganizationId, UserId } from '../../domain/ids.js';
import { normalizeTagName } from '../../domain/tag.js';
import type { TagRepository } from '../ports/tag-repository.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

export interface ListByTagDeps {
  readonly todos: TodoRepository;
  readonly tags: TagRepository;
  readonly guard: MembershipGuard;
}

export class ListByTag {
  constructor(private readonly deps: ListByTagDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
    rawTagName: string,
  ): Promise<readonly TodoWithTags[]> {
    await this.deps.guard.assertMember(userId, organizationId);
    const name = normalizeTagName(rawTagName);
    const tag = await this.deps.tags.findByName(name, organizationId);
    if (tag === null) {
      throw new NotFoundError('tag not found');
    }
    return this.deps.todos.listByTag({ organizationId, tagId: tag.id });
  }
}
