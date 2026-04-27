import type { ProjectRepository } from '../../src/application/ports/project-repository.js';
import type { OrganizationId, ProjectId } from '../../src/domain/ids.js';
import type { Project } from '../../src/domain/project.js';

export class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<ProjectId, Project>();

  insert(project: Project): Promise<void> {
    this.projects.set(project.id, project);
    return Promise.resolve();
  }

  update(project: Project): Promise<void> {
    this.projects.set(project.id, project);
    return Promise.resolve();
  }

  delete(id: ProjectId): Promise<boolean> {
    return Promise.resolve(this.projects.delete(id));
  }

  findById(id: ProjectId): Promise<Project | null> {
    return Promise.resolve(this.projects.get(id) ?? null);
  }

  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Project[]> {
    const out: Project[] = [];
    for (const p of this.projects.values()) {
      if (p.organizationId === organizationId) {
        out.push(p);
      }
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(out);
  }
}
