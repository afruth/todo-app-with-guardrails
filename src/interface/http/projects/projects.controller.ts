import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { asOrganizationId, asProjectId } from '../../../domain/ids.js';
import type { Project } from '../../../domain/project.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth.guard.js';
import { PROJECT_USE_CASES, type ProjectUseCases } from '../tokens.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';

const createProjectSchema = z.object({ name: z.string() });
const renameProjectSchema = z.object({ name: z.string() });
type CreateProjectDto = z.infer<typeof createProjectSchema>;
type RenameProjectDto = z.infer<typeof renameProjectSchema>;

interface ProjectView {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
}

const toView = (p: Project): ProjectView => ({
  id: p.id,
  organizationId: p.organizationId,
  name: p.name,
});

@Controller('api/organizations/:orgId/projects')
@UseGuards(AuthGuard)
export class OrgProjectsController {
  constructor(@Inject(PROJECT_USE_CASES) private readonly cases: ProjectUseCases) {}

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
  ): Promise<readonly ProjectView[]> {
    const projects = await this.cases.listProjects.execute(
      req.userId,
      asOrganizationId(orgId),
    );
    return projects.map(toView);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(createProjectSchema)) input: CreateProjectDto,
  ): Promise<ProjectView> {
    const project = await this.cases.createProject.execute(
      req.userId,
      asOrganizationId(orgId),
      input.name,
    );
    return toView(project);
  }
}

@Controller('api/projects')
@UseGuards(AuthGuard)
export class ProjectItemController {
  constructor(@Inject(PROJECT_USE_CASES) private readonly cases: ProjectUseCases) {}

  @Patch(':id')
  async rename(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(renameProjectSchema)) input: RenameProjectDto,
  ): Promise<ProjectView> {
    const project = await this.cases.renameProject.execute(
      req.userId,
      asProjectId(id),
      input.name,
    );
    return toView(project);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.cases.deleteProject.execute(req.userId, asProjectId(id));
  }
}
