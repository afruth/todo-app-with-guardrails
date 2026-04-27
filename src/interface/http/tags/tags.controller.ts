import {
  Controller,
  Get,
  Inject,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { asOrganizationId } from '../../../domain/ids.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth.guard.js';
import { TAG_USE_CASES, type TagUseCases } from '../tokens.js';
import { toView, type TodoView } from '../todos/todos.dto.js';

interface TagView {
  readonly id: string;
  readonly name: string;
}

@Controller('api/organizations/:orgId')
@UseGuards(AuthGuard)
export class TagsController {
  constructor(@Inject(TAG_USE_CASES) private readonly cases: TagUseCases) {}

  @Get('tags')
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
  ): Promise<readonly TagView[]> {
    const tags = await this.cases.listTags.execute(req.userId, asOrganizationId(orgId));
    return tags.map((t) => ({ id: t.id, name: t.name }));
  }

  @Get('tags/:name/todos')
  async todosForTag(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Param('name') name: string,
  ): Promise<readonly TodoView[]> {
    const todos = await this.cases.listByTag.execute(
      req.userId,
      asOrganizationId(orgId),
      name,
    );
    return todos.map(toView);
  }
}
