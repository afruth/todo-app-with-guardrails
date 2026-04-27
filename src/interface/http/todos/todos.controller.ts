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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { asOrganizationId, asProjectId, asTodoId } from '../../../domain/ids.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth.guard.js';
import { TODO_USE_CASES, type TodoUseCases } from '../tokens.js';
import { ZodValidationPipe } from '../zod-validation.pipe.js';
import {
  createTodoSchema,
  listTodosQuerySchema,
  moveTodoSchema,
  toView,
  updateTodoSchema,
  upcomingQuerySchema,
  type CreateTodoDto,
  type ListTodosQueryDto,
  type MoveTodoDto,
  type TodoView,
  type UpcomingQueryDto,
  type UpdateTodoDto,
} from './todos.dto.js';

@Controller('api/organizations/:orgId')
@UseGuards(AuthGuard)
export class TodosController {
  constructor(@Inject(TODO_USE_CASES) private readonly cases: TodoUseCases) {}

  @Get('todos')
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Query(new ZodValidationPipe(listTodosQuerySchema)) query: ListTodosQueryDto,
  ): Promise<readonly TodoView[]> {
    const todos = await this.cases.listTodos.execute(
      req.userId,
      asOrganizationId(orgId),
      {
        ...(query.projectId === undefined ? {} : { projectId: asProjectId(query.projectId) }),
      },
    );
    return todos.map(toView);
  }

  @Get('todos/upcoming')
  async upcoming(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
    @Query(new ZodValidationPipe(upcomingQuerySchema)) query: UpcomingQueryDto,
  ): Promise<readonly TodoView[]> {
    const todos = await this.cases.listUpcoming.execute(
      req.userId,
      asOrganizationId(orgId),
      query.limit === undefined ? {} : { limit: query.limit },
    );
    return todos.map(toView);
  }

  @Post('todos')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createTodoSchema)) input: CreateTodoDto,
  ): Promise<TodoView> {
    const todo = await this.cases.createTodo.execute(
      req.userId,
      asProjectId(input.projectId),
      input,
    );
    return toView(todo);
  }
}

@Controller('api/todos')
@UseGuards(AuthGuard)
export class TodoItemController {
  constructor(@Inject(TODO_USE_CASES) private readonly cases: TodoUseCases) {}

  @Get(':id')
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TodoView> {
    return toView(await this.cases.getTodo.execute(req.userId, asTodoId(id)));
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTodoSchema)) input: UpdateTodoDto,
  ): Promise<TodoView> {
    return toView(
      await this.cases.updateTodo.execute(req.userId, asTodoId(id), input),
    );
  }

  @Patch(':id/move')
  async move(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveTodoSchema)) input: MoveTodoDto,
  ): Promise<TodoView> {
    return toView(
      await this.cases.moveTodo.execute(
        req.userId,
        asTodoId(id),
        asProjectId(input.projectId),
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.cases.deleteTodo.execute(req.userId, asTodoId(id));
  }
}
