import { NotFoundError, ValidationError } from '../../domain/errors.js';
import { isPending, validateInviteToken } from '../../domain/invite.js';
import type { Organization } from '../../domain/organization.js';
import type { InviteRepository } from '../ports/invite-repository.js';
import type { OrganizationRepository } from '../ports/organization-repository.js';

export interface PreviewInviteDeps {
  readonly invites: InviteRepository;
  readonly organizations: OrganizationRepository;
}

export class PreviewInvite {
  constructor(private readonly deps: PreviewInviteDeps) {}

  async execute(rawToken: string): Promise<Organization> {
    const token = validateInviteToken(rawToken);
    const invite = await this.deps.invites.findByToken(token);
    if (invite === null) {
      throw new NotFoundError('invite not found');
    }
    if (!isPending(invite)) {
      throw new ValidationError('invite is no longer valid');
    }
    const org = await this.deps.organizations.findById(invite.organizationId);
    if (org === null) {
      throw new NotFoundError('organization not found');
    }
    return org;
  }
}
