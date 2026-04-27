import type { TokenSigner } from '../../application/ports/token-signer.js';
import type { AcceptInvite } from '../../application/use-cases/accept-invite.js';
import type { CreateInvite } from '../../application/use-cases/create-invite.js';
import type { CreateOrganization } from '../../application/use-cases/create-organization.js';
import type { CreateProject } from '../../application/use-cases/create-project.js';
import type { CreateTodo } from '../../application/use-cases/create-todo.js';
import type { DeleteProject } from '../../application/use-cases/delete-project.js';
import type { DeleteTodo } from '../../application/use-cases/delete-todo.js';
import type { GetTodo } from '../../application/use-cases/get-todo.js';
import type { ListByTag } from '../../application/use-cases/list-by-tag.js';
import type { ListInvites } from '../../application/use-cases/list-invites.js';
import type { ListMembers } from '../../application/use-cases/list-members.js';
import type { ListMyOrganizations } from '../../application/use-cases/list-my-organizations.js';
import type { ListProjects } from '../../application/use-cases/list-projects.js';
import type { ListTags } from '../../application/use-cases/list-tags.js';
import type { ListTodos } from '../../application/use-cases/list-todos.js';
import type { ListUpcoming } from '../../application/use-cases/list-upcoming.js';
import type { LogIn } from '../../application/use-cases/log-in.js';
import type { MoveTodo } from '../../application/use-cases/move-todo.js';
import type { PreviewInvite } from '../../application/use-cases/preview-invite.js';
import type { RemoveMember } from '../../application/use-cases/remove-member.js';
import type { RenameProject } from '../../application/use-cases/rename-project.js';
import type { RevokeInvite } from '../../application/use-cases/revoke-invite.js';
import type { SignUp } from '../../application/use-cases/sign-up.js';
import type { UpdateOrganization } from '../../application/use-cases/update-organization.js';
import type { UpdateTodo } from '../../application/use-cases/update-todo.js';

export const TOKEN_SIGNER = Symbol('TOKEN_SIGNER');
export const AUTH_USE_CASES = Symbol('AUTH_USE_CASES');
export const ORG_USE_CASES = Symbol('ORG_USE_CASES');
export const PROJECT_USE_CASES = Symbol('PROJECT_USE_CASES');
export const TODO_USE_CASES = Symbol('TODO_USE_CASES');
export const TAG_USE_CASES = Symbol('TAG_USE_CASES');
export const INVITE_USE_CASES = Symbol('INVITE_USE_CASES');

export type TokenSignerToken = TokenSigner;

export interface AuthUseCases {
  readonly signUp: SignUp;
  readonly logIn: LogIn;
}

export interface OrgUseCases {
  readonly createOrganization: CreateOrganization;
  readonly updateOrganization: UpdateOrganization;
  readonly listMyOrganizations: ListMyOrganizations;
  readonly listMembers: ListMembers;
  readonly removeMember: RemoveMember;
}

export interface ProjectUseCases {
  readonly createProject: CreateProject;
  readonly renameProject: RenameProject;
  readonly deleteProject: DeleteProject;
  readonly listProjects: ListProjects;
}

export interface TodoUseCases {
  readonly createTodo: CreateTodo;
  readonly updateTodo: UpdateTodo;
  readonly deleteTodo: DeleteTodo;
  readonly getTodo: GetTodo;
  readonly listTodos: ListTodos;
  readonly listUpcoming: ListUpcoming;
  readonly moveTodo: MoveTodo;
}

export interface TagUseCases {
  readonly listTags: ListTags;
  readonly listByTag: ListByTag;
}

export interface InviteUseCases {
  readonly createInvite: CreateInvite;
  readonly listInvites: ListInvites;
  readonly revokeInvite: RevokeInvite;
  readonly acceptInvite: AcceptInvite;
  readonly previewInvite: PreviewInvite;
}
