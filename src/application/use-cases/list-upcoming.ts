import { ValidationError } from '../../domain/errors.js';
import type { OrganizationId, UserId } from '../../domain/ids.js';
import type { Clock } from '../ports/clock.js';
import type {
  TodoRepository,
  TodoWithTags,
} from '../ports/todo-repository.js';
import type { MembershipGuard } from './membership-guard.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export interface ListUpcomingDeps {
  readonly todos: TodoRepository;
  readonly guard: MembershipGuard;
  readonly clock: Clock;
}

export interface ListUpcomingInput {
  readonly limit?: number;
}

export class ListUpcoming {
  constructor(private readonly deps: ListUpcomingDeps) {}

  async execute(
    userId: UserId,
    organizationId: OrganizationId,
    input: ListUpcomingInput = {},
  ): Promise<readonly TodoWithTags[]> {
    await this.deps.guard.assertMember(userId, organizationId);
    const limit = this.normalizeLimit(input.limit);
    return this.deps.todos.listUpcoming({
      organizationId,
      fromIso: this.deps.clock.nowIso(),
      limit,
    });
  }

  private normalizeLimit(raw: number | undefined): number {
    if (raw === undefined) {
      return DEFAULT_LIMIT;
    }
    if (!Number.isInteger(raw) || raw < 1 || raw > MAX_LIMIT) {
      throw new ValidationError(
        `limit must be an integer between 1 and ${String(MAX_LIMIT)}`,
      );
    }
    return raw;
  }
}
