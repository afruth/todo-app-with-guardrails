import type { OrganizationId } from '../../domain/ids.js';
import type { Organization } from '../../domain/organization.js';

export interface OrganizationRepository {
  insert(organization: Organization): Promise<void>;
  update(organization: Organization): Promise<void>;
  findById(id: OrganizationId): Promise<Organization | null>;
}
