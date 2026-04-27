import { asc, eq } from 'drizzle-orm';
import type { ProjectRepository } from '../../application/ports/project-repository.js';
import {
  asOrganizationId,
  asProjectId,
  type OrganizationId,
  type ProjectId,
} from '../../domain/ids.js';
import type { Project } from '../../domain/project.js';
import type { Db } from './database.js';
import { projects } from './schema/projects.js';

interface Row {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toProject = (row: Row): Project => ({
  id: asProjectId(row.id),
  organizationId: asOrganizationId(row.organizationId),
  name: row.name,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db) {}

  async insert(project: Project): Promise<void> {
    await this.db.insert(projects).values({
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  }

  async update(project: Project): Promise<void> {
    await this.db
      .update(projects)
      .set({ name: project.name, updatedAt: project.updatedAt })
      .where(eq(projects.id, project.id));
  }

  async delete(id: ProjectId): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id));
    return result.changes > 0;
  }

  async findById(id: ProjectId): Promise<Project | null> {
    const rows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toProject(row);
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Project[]> {
    const rows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .orderBy(asc(projects.name));
    return rows.map(toProject);
  }
}
