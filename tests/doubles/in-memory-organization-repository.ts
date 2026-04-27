import type { OrganizationRepository } from '../../src/application/ports/organization-repository.js';
import type { OrganizationId } from '../../src/domain/ids.js';
import type { Organization } from '../../src/domain/organization.js';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly orgs = new Map<OrganizationId, Organization>();

  insert(organization: Organization): Promise<void> {
    this.orgs.set(organization.id, organization);
    return Promise.resolve();
  }

  update(organization: Organization): Promise<void> {
    this.orgs.set(organization.id, organization);
    return Promise.resolve();
  }

  findById(id: OrganizationId): Promise<Organization | null> {
    return Promise.resolve(this.orgs.get(id) ?? null);
  }
}
