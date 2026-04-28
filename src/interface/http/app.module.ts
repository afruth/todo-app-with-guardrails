import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import type { Clock } from '../../application/ports/clock.js';
import type { IdGenerator } from '../../application/ports/id-generator.js';
import type { InviteRepository } from '../../application/ports/invite-repository.js';
import type { MembershipRepository } from '../../application/ports/membership-repository.js';
import type { OrganizationRepository } from '../../application/ports/organization-repository.js';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';
import type { ProjectRepository } from '../../application/ports/project-repository.js';
import type { TagRepository } from '../../application/ports/tag-repository.js';
import type { TodoRepository } from '../../application/ports/todo-repository.js';
import type { TokenGenerator } from '../../application/ports/token-generator.js';
import type { TokenSigner } from '../../application/ports/token-signer.js';
import type { UserRepository } from '../../application/ports/user-repository.js';
import { AcceptInvite } from '../../application/use-cases/accept-invite.js';
import { CreateInvite } from '../../application/use-cases/create-invite.js';
import { CreateOrganization } from '../../application/use-cases/create-organization.js';
import { CreateProject } from '../../application/use-cases/create-project.js';
import { CreateTodo } from '../../application/use-cases/create-todo.js';
import { DeleteProject } from '../../application/use-cases/delete-project.js';
import { DeleteTodo } from '../../application/use-cases/delete-todo.js';
import { GetOrCreateTag } from '../../application/use-cases/get-or-create-tag.js';
import { GetTodo } from '../../application/use-cases/get-todo.js';
import { ListByTag } from '../../application/use-cases/list-by-tag.js';
import { ListInvites } from '../../application/use-cases/list-invites.js';
import { ListMembers } from '../../application/use-cases/list-members.js';
import { ListMyOrganizations } from '../../application/use-cases/list-my-organizations.js';
import { ListProjects } from '../../application/use-cases/list-projects.js';
import { ListTags } from '../../application/use-cases/list-tags.js';
import { ListTodos } from '../../application/use-cases/list-todos.js';
import { ListUpcoming } from '../../application/use-cases/list-upcoming.js';
import { LogIn } from '../../application/use-cases/log-in.js';
import { MembershipGuard } from '../../application/use-cases/membership-guard.js';
import { MoveTodo } from '../../application/use-cases/move-todo.js';
import { PreviewInvite } from '../../application/use-cases/preview-invite.js';
import { RemoveMember } from '../../application/use-cases/remove-member.js';
import { RenameProject } from '../../application/use-cases/rename-project.js';
import { RevokeInvite } from '../../application/use-cases/revoke-invite.js';
import { SignUp } from '../../application/use-cases/sign-up.js';
import { UpdateOrganization } from '../../application/use-cases/update-organization.js';
import { UpdateTodo } from '../../application/use-cases/update-todo.js';
import { AuthController } from './auth/auth.controller.js';
import { HealthController } from './health/health.controller.js';
import {
  InvitesPublicController,
  OrgInvitesController,
} from './invites/invites.controller.js';
import { OrganizationsController } from './organizations/organizations.controller.js';
import {
  OrgProjectsController,
  ProjectItemController,
} from './projects/projects.controller.js';
import { TagsController } from './tags/tags.controller.js';
import {
  TodoItemController,
  TodosController,
} from './todos/todos.controller.js';
import {
  AUTH_USE_CASES,
  INVITE_USE_CASES,
  ORG_USE_CASES,
  PROJECT_USE_CASES,
  TAG_USE_CASES,
  TODO_USE_CASES,
  TOKEN_SIGNER,
  type AuthUseCases,
  type InviteUseCases,
  type OrgUseCases,
  type ProjectUseCases,
  type TagUseCases,
  type TodoUseCases,
} from './tokens.js';

export interface AppDeps {
  readonly users: UserRepository;
  readonly organizations: OrganizationRepository;
  readonly memberships: MembershipRepository;
  readonly invites: InviteRepository;
  readonly projects: ProjectRepository;
  readonly tags: TagRepository;
  readonly todos: TodoRepository;
  readonly hasher: PasswordHasher;
  readonly tokens: TokenSigner;
  readonly inviteTokens: TokenGenerator;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

const buildAuth = (deps: AppDeps, createOrg: CreateOrganization): AuthUseCases => ({
  signUp: new SignUp({
    users: deps.users,
    hasher: deps.hasher,
    tokens: deps.tokens,
    clock: deps.clock,
    ids: deps.ids,
    createOrganization: createOrg,
  }),
  logIn: new LogIn({ users: deps.users, hasher: deps.hasher, tokens: deps.tokens }),
});

const buildOrg = (deps: AppDeps, guard: MembershipGuard, createOrg: CreateOrganization): OrgUseCases => ({
  createOrganization: createOrg,
  updateOrganization: new UpdateOrganization({
    organizations: deps.organizations,
    guard,
    clock: deps.clock,
  }),
  listMyOrganizations: new ListMyOrganizations(deps.memberships),
  listMembers: new ListMembers({ memberships: deps.memberships, guard }),
  removeMember: new RemoveMember({ memberships: deps.memberships, guard }),
});

const buildProjectCases = (deps: AppDeps, guard: MembershipGuard): ProjectUseCases => ({
  createProject: new CreateProject({
    projects: deps.projects,
    guard,
    clock: deps.clock,
    ids: deps.ids,
  }),
  renameProject: new RenameProject({
    projects: deps.projects,
    guard,
    clock: deps.clock,
  }),
  deleteProject: new DeleteProject({
    projects: deps.projects,
    todos: deps.todos,
    guard,
  }),
  listProjects: new ListProjects({ projects: deps.projects, guard }),
});

const buildTodoCases = (deps: AppDeps, guard: MembershipGuard): TodoUseCases => {
  const tagCase = new GetOrCreateTag({ tags: deps.tags, clock: deps.clock, ids: deps.ids });
  return {
    createTodo: new CreateTodo({
      todos: deps.todos,
      projects: deps.projects,
      tags: tagCase,
      guard,
      clock: deps.clock,
      ids: deps.ids,
    }),
    updateTodo: new UpdateTodo({
      todos: deps.todos,
      projects: deps.projects,
      tags: tagCase,
      guard,
      clock: deps.clock,
    }),
    deleteTodo: new DeleteTodo({ todos: deps.todos, guard }),
    getTodo: new GetTodo({ todos: deps.todos, guard }),
    listTodos: new ListTodos({ todos: deps.todos, guard }),
    listUpcoming: new ListUpcoming({ todos: deps.todos, guard, clock: deps.clock }),
    moveTodo: new MoveTodo({
      todos: deps.todos,
      projects: deps.projects,
      guard,
      clock: deps.clock,
    }),
  };
};

const buildTagCases = (deps: AppDeps, guard: MembershipGuard): TagUseCases => ({
  listTags: new ListTags({ tags: deps.tags, guard }),
  listByTag: new ListByTag({ todos: deps.todos, tags: deps.tags, guard }),
});

const buildInviteCases = (deps: AppDeps, guard: MembershipGuard): InviteUseCases => ({
  createInvite: new CreateInvite({
    invites: deps.invites,
    guard,
    clock: deps.clock,
    ids: deps.ids,
    tokens: deps.inviteTokens,
  }),
  listInvites: new ListInvites({ invites: deps.invites, guard }),
  revokeInvite: new RevokeInvite({ invites: deps.invites, guard, clock: deps.clock }),
  acceptInvite: new AcceptInvite({
    invites: deps.invites,
    memberships: deps.memberships,
    organizations: deps.organizations,
    clock: deps.clock,
    ids: deps.ids,
  }),
  previewInvite: new PreviewInvite({
    invites: deps.invites,
    organizations: deps.organizations,
  }),
});

const buildProviders = (deps: AppDeps): Provider[] => {
  const guard = new MembershipGuard(deps.memberships);
  const createOrg = new CreateOrganization({
    organizations: deps.organizations,
    memberships: deps.memberships,
    projects: deps.projects,
    clock: deps.clock,
    ids: deps.ids,
  });
  return [
    { provide: TOKEN_SIGNER, useValue: deps.tokens },
    { provide: AUTH_USE_CASES, useValue: buildAuth(deps, createOrg) },
    { provide: ORG_USE_CASES, useValue: buildOrg(deps, guard, createOrg) },
    { provide: PROJECT_USE_CASES, useValue: buildProjectCases(deps, guard) },
    { provide: TODO_USE_CASES, useValue: buildTodoCases(deps, guard) },
    { provide: TAG_USE_CASES, useValue: buildTagCases(deps, guard) },
    { provide: INVITE_USE_CASES, useValue: buildInviteCases(deps, guard) },
  ];
};

@Module({})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {
  static register(deps: AppDeps): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        HealthController,
        AuthController,
        OrganizationsController,
        OrgProjectsController,
        ProjectItemController,
        OrgInvitesController,
        InvitesPublicController,
        TodosController,
        TodoItemController,
        TagsController,
      ],
      providers: buildProviders(deps),
    };
  }
}
