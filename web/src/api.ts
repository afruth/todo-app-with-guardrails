export interface TodoView {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  isCompleted: boolean;
  deadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface TagView {
  id: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface OrgSummary {
  id: string;
  name: string;
  role: string;
  logoPath: string | null;
}

export interface OrganizationView {
  id: string;
  name: string;
  logoPath: string | null;
}

export interface ProjectView {
  id: string;
  organizationId: string;
  name: string;
}

export interface MembershipView {
  id: string;
  userId: string;
  userEmail: string;
  role: string;
}

export interface InviteView {
  id: string;
  token: string;
  emailHint: string | null;
  role: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}

const API_BASE = '/api';

export const TAGS_CHANGED_EVENT = 'todo-app:tags-changed';
export const PROJECTS_CHANGED_EVENT = 'todo-app:projects-changed';
export const ORGS_CHANGED_EVENT = 'todo-app:orgs-changed';
export const TODOS_CHANGED_EVENT = 'todo-app:todos-changed';

const dispatchEvent = (name: string): void => {
  window.dispatchEvent(new CustomEvent(name));
};

const buildHeaders = (init?: RequestInit): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  return headers;
};

const request = async <T,>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(API_BASE + path, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(init),
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = body as ApiError | null;
    throw new Error(err?.message ?? `request failed with status ${String(res.status)}`);
  }
  return body as T;
};

const upload = async <T,>(path: string, form: FormData): Promise<T> => {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const text = await res.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = body as ApiError | null;
    throw new Error(err?.message ?? `upload failed with status ${String(res.status)}`);
  }
  return body as T;
};

export const api = {
  register: (email: string, password: string) =>
    request<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  listOrganizations: () => request<OrgSummary[]>('/organizations'),
  createOrganization: async (name: string) => {
    const result = await request<OrganizationView>('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    dispatchEvent(ORGS_CHANGED_EVENT);
    return result;
  },
  updateOrganization: async (
    orgId: string,
    input: { name?: string; logoPath?: string | null },
  ) => {
    const result = await request<OrganizationView>(`/organizations/${orgId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    dispatchEvent(ORGS_CHANGED_EVENT);
    return result;
  },
  uploadOrganizationLogo: async (orgId: string, file: File) => {
    const form = new FormData();
    form.append('logo', file);
    const result = await upload<OrganizationView>(`/organizations/${orgId}/logo`, form);
    dispatchEvent(ORGS_CHANGED_EVENT);
    return result;
  },
  listMembers: (orgId: string) =>
    request<MembershipView[]>(`/organizations/${orgId}/members`),
  removeMember: (orgId: string, membershipId: string) =>
    request<void>(`/organizations/${orgId}/members/${membershipId}`, {
      method: 'DELETE',
    }),
  listInvites: (orgId: string) =>
    request<InviteView[]>(`/organizations/${orgId}/invites`),
  createInvite: (orgId: string, emailHint: string | null) =>
    request<InviteView>(`/organizations/${orgId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ emailHint }),
    }),
  revokeInvite: (orgId: string, inviteId: string) =>
    request<void>(`/organizations/${orgId}/invites/${inviteId}`, {
      method: 'DELETE',
    }),
  previewInvite: (token: string) =>
    request<{ id: string; name: string; logoPath: string | null }>(
      `/invites/${encodeURIComponent(token)}`,
    ),
  acceptInvite: async (token: string) => {
    const result = await request<{ organizationId: string; organizationName: string }>(
      '/invites/accept',
      { method: 'POST', body: JSON.stringify({ token }) },
    );
    dispatchEvent(ORGS_CHANGED_EVENT);
    return result;
  },
  listProjects: (orgId: string) =>
    request<ProjectView[]>(`/organizations/${orgId}/projects`),
  createProject: async (orgId: string, name: string) => {
    const result = await request<ProjectView>(`/organizations/${orgId}/projects`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    dispatchEvent(PROJECTS_CHANGED_EVENT);
    return result;
  },
  renameProject: async (projectId: string, name: string) => {
    const result = await request<ProjectView>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    dispatchEvent(PROJECTS_CHANGED_EVENT);
    return result;
  },
  deleteProject: async (projectId: string) => {
    await request<void>(`/projects/${projectId}`, { method: 'DELETE' });
    dispatchEvent(PROJECTS_CHANGED_EVENT);
  },
  listTodos: (orgId: string, projectId?: string) =>
    request<TodoView[]>(
      `/organizations/${orgId}/todos${
        projectId === undefined ? '' : `?projectId=${encodeURIComponent(projectId)}`
      }`,
    ),
  listUpcoming: (orgId: string) =>
    request<TodoView[]>(`/organizations/${orgId}/todos/upcoming`),
  createTodo: async (
    orgId: string,
    input: {
      projectId: string;
      title: string;
      deadlineAt?: string | null;
      tagNames?: string[];
    },
  ) => {
    const result = await request<TodoView>(`/organizations/${orgId}/todos`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    dispatchEvent(TAGS_CHANGED_EVENT);
    dispatchEvent(TODOS_CHANGED_EVENT);
    return result;
  },
  updateTodo: async (
    id: string,
    input: {
      title?: string;
      deadlineAt?: string | null;
      isCompleted?: boolean;
      tagNames?: string[];
    },
  ) => {
    const result = await request<TodoView>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    dispatchEvent(TAGS_CHANGED_EVENT);
    dispatchEvent(TODOS_CHANGED_EVENT);
    return result;
  },
  moveTodo: async (id: string, projectId: string) => {
    const result = await request<TodoView>(`/todos/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ projectId }),
    });
    dispatchEvent(TODOS_CHANGED_EVENT);
    return result;
  },
  deleteTodo: async (id: string) => {
    await request<void>(`/todos/${id}`, { method: 'DELETE' });
    dispatchEvent(TODOS_CHANGED_EVENT);
  },
  listTags: (orgId: string) =>
    request<TagView[]>(`/organizations/${orgId}/tags`),
  todosForTag: (orgId: string, name: string) =>
    request<TodoView[]>(
      `/organizations/${orgId}/tags/${encodeURIComponent(name)}/todos`,
    ),
};
