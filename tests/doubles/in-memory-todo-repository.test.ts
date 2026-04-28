import { asTodoId } from '../../src/domain/ids.js';
import { buildAppStack } from './build-app-stack.js';

const setup = async (): Promise<{
  stack: ReturnType<typeof buildAppStack>;
  userId: string;
  orgId: string;
  inboxId: string;
}> => {
  const stack = buildAppStack();
  const { user } = await stack.signUp.execute({
    email: 'a@b.co',
    password: 'password123',
  });
  const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!
    .organizationId;
  const inboxId = (await stack.listProjects.execute(user.id, orgId))[0]!.id;
  return { stack, userId: user.id, orgId, inboxId };
};

describe('InMemoryTodoRepository — dependency edges', () => {
  it('add/find/remove dependency round-trips and is idempotent', async () => {
    const { stack, userId, inboxId } = await setup();
    const a = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'a',
    });
    const b = await stack.createTodo.execute(userId as never, inboxId as never, {
      title: 'b',
    });
    const repo = stack.todos;

    await repo.addDependency(a.id, b.id);
    await repo.addDependency(a.id, b.id);
    expect(await repo.findPrerequisites(a.id)).toEqual([b.id]);
    expect(await repo.findDependents(b.id)).toEqual([a.id]);

    expect(await repo.removeDependency(a.id, b.id)).toBe(true);
    expect(await repo.removeDependency(a.id, b.id)).toBe(false);
    expect(await repo.findPrerequisites(a.id)).toEqual([]);
  });

  it('returns empty arrays for unknown todos and a never-stored dependent', async () => {
    const { stack } = await setup();
    const repo = stack.todos;
    expect(await repo.findPrerequisites(asTodoId('missing'))).toEqual([]);
    expect(await repo.findDependents(asTodoId('missing'))).toEqual([]);
    expect(
      await repo.removeDependency(asTodoId('missing'), asTodoId('also-missing')),
    ).toBe(false);
  });

  it('hydrates dependencies and toggles hasOpenPrerequisites with completion', async () => {
    const { stack, userId, inboxId } = await setup();
    const dependent = await stack.createTodo.execute(
      userId as never,
      inboxId as never,
      { title: 'dependent' },
    );
    const prerequisite = await stack.createTodo.execute(
      userId as never,
      inboxId as never,
      { title: 'prerequisite' },
    );
    const repo = stack.todos;
    await repo.addDependency(dependent.id, prerequisite.id);

    const blocked = await repo.findById(dependent.id);
    expect(blocked?.dependencies).toEqual([
      { id: prerequisite.id, title: 'prerequisite', isCompleted: false },
    ]);
    expect(blocked?.hasOpenPrerequisites).toBe(true);

    await stack.updateTodo.execute(userId as never, prerequisite.id, {
      isCompleted: true,
    });
    const unblocked = await repo.findById(dependent.id);
    expect(unblocked?.hasOpenPrerequisites).toBe(false);
    expect(unblocked?.dependencies[0]?.isCompleted).toBe(true);
  });

  it('drops orphan edges when the prerequisite todo is deleted', async () => {
    const { stack, userId, inboxId } = await setup();
    const dependent = await stack.createTodo.execute(
      userId as never,
      inboxId as never,
      { title: 'dependent' },
    );
    const prerequisite = await stack.createTodo.execute(
      userId as never,
      inboxId as never,
      { title: 'prerequisite' },
    );
    const repo = stack.todos;
    await repo.addDependency(dependent.id, prerequisite.id);
    await repo.delete(prerequisite.id);

    const view = await repo.findById(dependent.id);
    expect(view?.dependencies).toEqual([]);
    expect(view?.hasOpenPrerequisites).toBe(false);
    expect(await repo.findPrerequisites(dependent.id)).toEqual([]);
  });
});
