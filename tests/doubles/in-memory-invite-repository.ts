import type { InviteRepository } from '../../src/application/ports/invite-repository.js';
import type { InviteId, OrganizationId } from '../../src/domain/ids.js';
import type { Invite } from '../../src/domain/invite.js';

export class InMemoryInviteRepository implements InviteRepository {
  private readonly invites = new Map<InviteId, Invite>();

  insert(invite: Invite): Promise<void> {
    this.invites.set(invite.id, invite);
    return Promise.resolve();
  }

  update(invite: Invite): Promise<void> {
    this.invites.set(invite.id, invite);
    return Promise.resolve();
  }

  findById(id: InviteId): Promise<Invite | null> {
    return Promise.resolve(this.invites.get(id) ?? null);
  }

  findByToken(token: string): Promise<Invite | null> {
    for (const i of this.invites.values()) {
      if (i.token === token) {
        return Promise.resolve(i);
      }
    }
    return Promise.resolve(null);
  }

  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Invite[]> {
    const out: Invite[] = [];
    for (const i of this.invites.values()) {
      if (i.organizationId === organizationId) {
        out.push(i);
      }
    }
    out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return Promise.resolve(out);
  }
}
