import type {
  InviteId,
  OrganizationId,
} from '../../domain/ids.js';
import type { Invite } from '../../domain/invite.js';

export interface InviteRepository {
  insert(invite: Invite): Promise<void>;
  update(invite: Invite): Promise<void>;
  findById(id: InviteId): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;
  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Invite[]>;
}
