import { AcceptInvite } from '../../src/application/use-cases/accept-invite.js';
import { CreateInvite } from '../../src/application/use-cases/create-invite.js';
import { CreateOrganization } from '../../src/application/use-cases/create-organization.js';
import { CreateProject } from '../../src/application/use-cases/create-project.js';
import { CreateTodo } from '../../src/application/use-cases/create-todo.js';
import { DeleteProject } from '../../src/application/use-cases/delete-project.js';
import { DeleteTodo } from '../../src/application/use-cases/delete-todo.js';
import { GetOrCreateTag } from '../../src/application/use-cases/get-or-create-tag.js';
import { GetTodo } from '../../src/application/use-cases/get-todo.js';
import { ListByTag } from '../../src/application/use-cases/list-by-tag.js';
import { ListInvites } from '../../src/application/use-cases/list-invites.js';
import { ListMembers } from '../../src/application/use-cases/list-members.js';
import { ListMyOrganizations } from '../../src/application/use-cases/list-my-organizations.js';
import { ListProjects } from '../../src/application/use-cases/list-projects.js';
import { ListTags } from '../../src/application/use-cases/list-tags.js';
import { ListTodos } from '../../src/application/use-cases/list-todos.js';
import { ListUpcoming } from '../../src/application/use-cases/list-upcoming.js';
import { LogIn } from '../../src/application/use-cases/log-in.js';
import { MembershipGuard } from '../../src/application/use-cases/membership-guard.js';
import { MoveTodo } from '../../src/application/use-cases/move-todo.js';
import { PreviewInvite } from '../../src/application/use-cases/preview-invite.js';
import { RemoveMember } from '../../src/application/use-cases/remove-member.js';
import { RenameProject } from '../../src/application/use-cases/rename-project.js';
import { RevokeInvite } from '../../src/application/use-cases/revoke-invite.js';
import { SignUp } from '../../src/application/use-cases/sign-up.js';
import { UpdateOrganization } from '../../src/application/use-cases/update-organization.js';
import { UpdateTodo } from '../../src/application/use-cases/update-todo.js';
import { FakeClock } from './fake-clock.js';
import { FakeIdGenerator } from './fake-id-generator.js';
import { FakePasswordHasher } from './fake-password-hasher.js';
import { FakeTokenGenerator } from './fake-token-generator.js';
import { FakeTokenSigner } from './fake-token-signer.js';
import { InMemoryInviteRepository } from './in-memory-invite-repository.js';
import { InMemoryMembershipRepository } from './in-memory-membership-repository.js';
import { InMemoryOrganizationRepository } from './in-memory-organization-repository.js';
import { InMemoryProjectRepository } from './in-memory-project-repository.js';
import { InMemoryTagRepository } from './in-memory-tag-repository.js';
import { InMemoryTodoRepository } from './in-memory-todo-repository.js';
import { InMemoryUserRepository } from './in-memory-user-repository.js';

interface Repos {
  users: InMemoryUserRepository;
  organizations: InMemoryOrganizationRepository;
  memberships: InMemoryMembershipRepository;
  invites: InMemoryInviteRepository;
  projects: InMemoryProjectRepository;
  tags: InMemoryTagRepository;
  todos: InMemoryTodoRepository;
}

interface Adapters {
  clock: FakeClock;
  ids: FakeIdGenerator;
  hasher: FakePasswordHasher;
  signerTokens: FakeTokenSigner;
  inviteTokens: FakeTokenGenerator;
}

const buildRepos = (): Repos => {
  const users = new InMemoryUserRepository();
  const organizations = new InMemoryOrganizationRepository();
  const memberships = new InMemoryMembershipRepository(organizations, users);
  const invites = new InMemoryInviteRepository();
  const projects = new InMemoryProjectRepository();
  const tags = new InMemoryTagRepository();
  const todos = new InMemoryTodoRepository(projects, tags);
  return { users, organizations, memberships, invites, projects, tags, todos };
};

const buildAuth = (
  repos: Repos,
  adapters: Adapters,
  createOrg: CreateOrganization,
): { signUp: SignUp; logIn: LogIn } => ({
  signUp: new SignUp({
    users: repos.users,
    hasher: adapters.hasher,
    tokens: adapters.signerTokens,
    clock: adapters.clock,
    ids: adapters.ids,
    createOrganization: createOrg,
  }),
  logIn: new LogIn({
    users: repos.users,
    hasher: adapters.hasher,
    tokens: adapters.signerTokens,
  }),
});

const buildOrgCases = (
  repos: Repos,
  adapters: Adapters,
  guard: MembershipGuard,
  createOrg: CreateOrganization,
): {
  createOrganization: CreateOrganization;
  updateOrganization: UpdateOrganization;
  listMyOrganizations: ListMyOrganizations;
  listMembers: ListMembers;
  removeMember: RemoveMember;
} => ({
  createOrganization: createOrg,
  updateOrganization: new UpdateOrganization({
    organizations: repos.organizations,
    guard,
    clock: adapters.clock,
  }),
  listMyOrganizations: new ListMyOrganizations(repos.memberships),
  listMembers: new ListMembers({ memberships: repos.memberships, guard }),
  removeMember: new RemoveMember({ memberships: repos.memberships, guard }),
});

const buildInviteCases = (
  repos: Repos,
  adapters: Adapters,
  guard: MembershipGuard,
): {
  createInvite: CreateInvite;
  listInvites: ListInvites;
  revokeInvite: RevokeInvite;
  acceptInvite: AcceptInvite;
  previewInvite: PreviewInvite;
} => ({
  createInvite: new CreateInvite({
    invites: repos.invites,
    guard,
    clock: adapters.clock,
    ids: adapters.ids,
    tokens: adapters.inviteTokens,
  }),
  listInvites: new ListInvites({ invites: repos.invites, guard }),
  revokeInvite: new RevokeInvite({
    invites: repos.invites,
    guard,
    clock: adapters.clock,
  }),
  acceptInvite: new AcceptInvite({
    invites: repos.invites,
    memberships: repos.memberships,
    organizations: repos.organizations,
    clock: adapters.clock,
    ids: adapters.ids,
  }),
  previewInvite: new PreviewInvite({
    invites: repos.invites,
    organizations: repos.organizations,
  }),
});

const buildProjectCases = (
  repos: Repos,
  adapters: Adapters,
  guard: MembershipGuard,
): {
  createProject: CreateProject;
  renameProject: RenameProject;
  deleteProject: DeleteProject;
  listProjects: ListProjects;
} => ({
  createProject: new CreateProject({
    projects: repos.projects,
    guard,
    clock: adapters.clock,
    ids: adapters.ids,
  }),
  renameProject: new RenameProject({
    projects: repos.projects,
    guard,
    clock: adapters.clock,
  }),
  deleteProject: new DeleteProject({
    projects: repos.projects,
    todos: repos.todos,
    guard,
  }),
  listProjects: new ListProjects({ projects: repos.projects, guard }),
});

const buildTodoCases = (
  repos: Repos,
  adapters: Adapters,
  guard: MembershipGuard,
): {
  createTodo: CreateTodo;
  updateTodo: UpdateTodo;
  deleteTodo: DeleteTodo;
  getTodo: GetTodo;
  listTodos: ListTodos;
  listUpcoming: ListUpcoming;
  listByTag: ListByTag;
  listTags: ListTags;
  moveTodo: MoveTodo;
  getOrCreateTag: GetOrCreateTag;
} => {
  const tagCase = new GetOrCreateTag({
    tags: repos.tags,
    clock: adapters.clock,
    ids: adapters.ids,
  });
  return {
    createTodo: new CreateTodo({
      todos: repos.todos,
      projects: repos.projects,
      tags: tagCase,
      guard,
      clock: adapters.clock,
      ids: adapters.ids,
    }),
    updateTodo: new UpdateTodo({
      todos: repos.todos,
      projects: repos.projects,
      tags: tagCase,
      guard,
      clock: adapters.clock,
    }),
    deleteTodo: new DeleteTodo({ todos: repos.todos, guard }),
    getTodo: new GetTodo({ todos: repos.todos, guard }),
    listTodos: new ListTodos({ todos: repos.todos, guard }),
    listUpcoming: new ListUpcoming({
      todos: repos.todos,
      guard,
      clock: adapters.clock,
    }),
    listByTag: new ListByTag({
      todos: repos.todos,
      tags: repos.tags,
      guard,
    }),
    listTags: new ListTags({ tags: repos.tags, guard }),
    moveTodo: new MoveTodo({
      todos: repos.todos,
      projects: repos.projects,
      guard,
      clock: adapters.clock,
    }),
    getOrCreateTag: tagCase,
  };
};

export interface AppStack
  extends Repos,
    ReturnType<typeof buildAuth>,
    ReturnType<typeof buildOrgCases>,
    ReturnType<typeof buildInviteCases>,
    ReturnType<typeof buildProjectCases>,
    ReturnType<typeof buildTodoCases> {
  guard: MembershipGuard;
  clock: FakeClock;
}

export const buildAppStack = (now = '2026-04-26T00:00:00.000Z'): AppStack => {
  const repos = buildRepos();
  const adapters: Adapters = {
    clock: new FakeClock(now),
    ids: new FakeIdGenerator('id'),
    hasher: new FakePasswordHasher(),
    signerTokens: new FakeTokenSigner(),
    inviteTokens: new FakeTokenGenerator(),
  };
  const guard = new MembershipGuard(repos.memberships);
  const createOrg = new CreateOrganization({
    organizations: repos.organizations,
    memberships: repos.memberships,
    projects: repos.projects,
    clock: adapters.clock,
    ids: adapters.ids,
  });
  return {
    ...repos,
    ...buildAuth(repos, adapters, createOrg),
    ...buildOrgCases(repos, adapters, guard, createOrg),
    ...buildInviteCases(repos, adapters, guard),
    ...buildProjectCases(repos, adapters, guard),
    ...buildTodoCases(repos, adapters, guard),
    guard,
    clock: adapters.clock,
  };
};
