import { ConflictError, ForbiddenError, NotFoundError } from '../../domain/errors.js';
import { asProjectId } from '../../domain/ids.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('projects', () => {
  it('listProjects returns the auto-created Inbox; createProject adds another; rename works; delete works only when empty', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!.organizationId;
    expect((await stack.listProjects.execute(user.id, orgId)).map((p) => p.name)).toEqual([
      'Inbox',
    ]);
    const work = await stack.createProject.execute(user.id, orgId, 'Work');
    expect(work.name).toBe('Work');
    const renamed = await stack.renameProject.execute(user.id, work.id, 'Work Stuff');
    expect(renamed.name).toBe('Work Stuff');
    await stack.deleteProject.execute(user.id, work.id);
    const after = await stack.listProjects.execute(user.id, orgId);
    expect(after.map((p) => p.name)).toEqual(['Inbox']);
  });

  it('refuses to delete a project that still has todos', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!.organizationId;
    const inbox = (await stack.listProjects.execute(user.id, orgId))[0];
    await stack.createTodo.execute(user.id, inbox!.id, { title: 't1' });
    await expect(stack.deleteProject.execute(user.id, inbox!.id)).rejects.toThrow(
      ConflictError,
    );
  });

  it('rejects rename for a non-member', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const { user: b } = await stack.signUp.execute({ email: 'b@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const inbox = (await stack.listProjects.execute(a.id, orgId))[0];
    await expect(
      stack.renameProject.execute(b.id, inbox!.id, 'x'),
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects delete from a non-owner', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const { user: b } = await stack.signUp.execute({ email: 'b@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const invite = await stack.createInvite.execute(a.id, orgId);
    await stack.acceptInvite.execute(b.id, invite.token);
    const inbox = (await stack.listProjects.execute(a.id, orgId))[0];
    await expect(stack.deleteProject.execute(b.id, inbox!.id)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('rename / delete throw NotFoundError for an unknown project id', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    await expect(
      stack.renameProject.execute(user.id, asProjectId('missing'), 'x'),
    ).rejects.toThrow(NotFoundError);
    await expect(
      stack.deleteProject.execute(user.id, asProjectId('missing')),
    ).rejects.toThrow(NotFoundError);
  });
});
