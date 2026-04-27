import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors.js';
import { asProjectId, asTodoId } from '../../domain/ids.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

const setup = async (): Promise<{
  stack: ReturnType<typeof buildAppStack>;
  userId: string;
  orgId: string;
  inboxId: string;
  workId: string;
}> => {
  const stack = buildAppStack();
  const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
  const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!.organizationId;
  const inboxId = (await stack.listProjects.execute(user.id, orgId))[0]!.id;
  const work = await stack.createProject.execute(user.id, orgId, 'Work');
  return {
    stack,
    userId: user.id,
    orgId,
    inboxId,
    workId: work.id,
  };
};

describe('todos use cases', () => {
  it('createTodo, listTodos (org-wide and project-filtered), getTodo, updateTodo', async () => {
    const { stack, userId, orgId, inboxId, workId } = await setup();
    const a = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'a',
      tagNames: ['shopping'],
    });
    const b = await stack.createTodo.execute(userId as never, workId as never, {
      title: 'b',
      deadlineAt: '2026-05-01T00:00:00Z',
    });
    const all = await stack.listTodos.execute(userId as never, orgId as never);
    expect(all.map((t) => t.title).sort()).toEqual(['a', 'b']);
    const onlyInbox = await stack.listTodos.execute(
      userId as never,
      orgId as never,
      { projectId: inboxId as never },
    );
    expect(onlyInbox.map((t) => t.title)).toEqual(['a']);
    const got = await stack.getTodo.execute(userId as never, a.id);
    expect(got.tagNames).toEqual(['shopping']);
    const updated = await stack.updateTodo.execute(userId as never, b.id, {
      isCompleted: true,
    });
    expect(updated.isCompleted).toBe(true);
  });

  it('moveTodo moves a todo between projects in the same org', async () => {
    const { stack, userId, inboxId, workId } = await setup();
    const todo = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'move me',
    });
    const moved = await stack.moveTodo.execute(
      userId as never,
      todo.id,
      workId as never,
    );
    expect(moved.projectId).toBe(workId);
  });

  it('moveTodo refuses to cross organizations', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const personalOrgId = (await stack.listMyOrganizations.execute(user.id))[0]!
      .organizationId;
    const inbox = (await stack.listProjects.execute(user.id, personalOrgId))[0]!;
    const acmeOrg = await stack.createOrganization.execute(user.id, 'Acme');
    const todo = await stack.createTodo.execute(user.id, inbox.id, { title: 'x' });
    await expect(
      stack.moveTodo.execute(user.id, todo.id, acmeOrg.inboxProject.id),
    ).rejects.toThrow(ConflictError);
  });

  it('moveTodo throws NotFoundError for an unknown todo or target project', async () => {
    const { stack, userId, inboxId } = await setup();
    await expect(
      stack.moveTodo.execute(userId as never, asTodoId('missing'), inboxId as never),
    ).rejects.toThrow(NotFoundError);
    const todo = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'x',
    });
    await expect(
      stack.moveTodo.execute(userId as never, todo.id, asProjectId('missing')),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects creation when not a member of the target project\'s org', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const { user: b } = await stack.signUp.execute({ email: 'b@b.co', password: 'password123' });
    const orgIdA = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const inboxA = (await stack.listProjects.execute(a.id, orgIdA))[0]!;
    await expect(
      stack.createTodo.execute(b.id, inboxA.id, { title: 'sneaky' }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('listUpcoming filters and orders by deadline; respects limit', async () => {
    const { stack, userId, orgId, inboxId } = await setup();
    await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'past',
      deadlineAt: '2026-04-20T00:00:00Z',
    });
    await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'soon',
      deadlineAt: '2026-04-30T00:00:00Z',
    });
    await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'later',
      deadlineAt: '2026-05-02T00:00:00Z',
    });
    const upcoming = await stack.listUpcoming.execute(userId as never, orgId as never);
    expect(upcoming.map((t) => t.title)).toEqual(['soon', 'later']);
    const one = await stack.listUpcoming.execute(userId as never, orgId as never, {
      limit: 1,
    });
    expect(one).toHaveLength(1);
    await expect(
      stack.listUpcoming.execute(userId as never, orgId as never, { limit: 0 }),
    ).rejects.toThrow(ValidationError);
    await expect(
      stack.listUpcoming.execute(userId as never, orgId as never, { limit: 1.5 }),
    ).rejects.toThrow(ValidationError);
  });

  it('listByTag filters todos in the org by tag', async () => {
    const { stack, userId, orgId, inboxId, workId } = await setup();
    await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'a',
      tagNames: ['urgent'],
    });
    await stack.createTodo.execute(userId as never, workId as never, {
      title: 'b',
      tagNames: ['urgent', 'work'],
    });
    const tagged = await stack.listByTag.execute(
      userId as never,
      orgId as never,
      'urgent',
    );
    expect(tagged.map((t) => t.title).sort()).toEqual(['a', 'b']);
    await expect(
      stack.listByTag.execute(userId as never, orgId as never, 'nope'),
    ).rejects.toThrow(NotFoundError);
  });

  it('deleteTodo removes the todo; getTodo and deleteTodo throw NotFoundError on a missing id', async () => {
    const { stack, userId, inboxId } = await setup();
    const todo = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'x',
    });
    await stack.deleteTodo.execute(userId as never, todo.id);
    await expect(stack.getTodo.execute(userId as never, todo.id)).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      stack.deleteTodo.execute(userId as never, asTodoId('missing')),
    ).rejects.toThrow(NotFoundError);
  });

  it('updateTodo throws NotFoundError on missing id', async () => {
    const { stack, userId } = await setup();
    await expect(
      stack.updateTodo.execute(userId as never, asTodoId('missing'), { title: 'x' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('updateTodo updates title, deadline and tags; preserves tags when tagNames omitted; clears deadline when null', async () => {
    const { stack, userId, inboxId } = await setup();
    const todo = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'old',
      deadlineAt: '2026-05-01T00:00:00Z',
      tagNames: ['a'],
    });
    const renamed = await stack.updateTodo.execute(userId as never, todo.id, {
      title: 'new',
    });
    expect(renamed.title).toBe('new');
    expect(renamed.tagNames).toEqual(['a']);
    const cleared = await stack.updateTodo.execute(userId as never, todo.id, {
      deadlineAt: null,
      tagNames: ['b'],
    });
    expect(cleared.deadlineAt).toBeNull();
    expect(cleared.tagNames).toEqual(['b']);
  });

  it('createTodo deduplicates duplicate tag names (case-insensitive)', async () => {
    const { stack, userId, inboxId } = await setup();
    const todo = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 't',
      tagNames: ['Work', 'work'],
    });
    expect(todo.tagNames).toEqual(['work']);
  });

  it('createTodo rejects an invalid title', async () => {
    const { stack, userId, inboxId } = await setup();
    await expect(
      stack.createTodo.execute(userId as never, inboxId as never, { title: '' }),
    ).rejects.toThrow(ValidationError);
  });

  it('createTodo rejects a missing project', async () => {
    const { stack, userId } = await setup();
    await expect(
      stack.createTodo.execute(userId as never, asProjectId('missing'), { title: 't' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('listTags returns the org\'s tags via the membership-guarded use case', async () => {
    const { stack, userId, orgId, inboxId } = await setup();
    await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 't',
      tagNames: ['alpha', 'beta'],
    });
    const tags = await stack.listTags.execute(userId as never, orgId as never);
    expect(tags.map((t) => t.name).sort()).toEqual(['alpha', 'beta']);
  });
});
