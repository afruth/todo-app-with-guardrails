import type {
  OrganizationId,
  ProjectId,
} from '../../domain/ids.js';
import type { Project } from '../../domain/project.js';

export interface ProjectRepository {
  insert(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  delete(id: ProjectId): Promise<boolean>;
  findById(id: ProjectId): Promise<Project | null>;
  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Project[]>;
}
