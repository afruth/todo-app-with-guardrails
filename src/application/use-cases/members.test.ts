import { ConflictError, ForbiddenError, NotFoundError } from '../../domain/errors.js';
import { asMembershipId } from '../../domain/ids.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('members', () => {
  it('listMembers returns owner + invitee', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const { user: b } = await stack.signUp.execute({ email: 'b@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const invite = await stack.createInvite.execute(a.id, orgId);
    await stack.acceptInvite.execute(b.id, invite.token);
    const members = await stack.listMembers.execute(a.id, orgId);
    expect(members.map((m) => m.userEmail).sort()).toEqual(['a@b.co', 'b@b.co']);
  });

  it('removeMember removes a non-owner', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const { user: b } = await stack.signUp.execute({ email: 'b@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const invite = await stack.createInvite.execute(a.id, orgId);
    await stack.acceptInvite.execute(b.id, invite.token);
    const members = await stack.listMembers.execute(a.id, orgId);
    const target = members.find((m) => m.userEmail === 'b@b.co');
    await stack.removeMember.execute(a.id, orgId, target!.id);
    const after = await stack.listMembers.execute(a.id, orgId);
    expect(after.map((m) => m.userEmail)).toEqual(['a@b.co']);
  });

  it('refuses to remove the last owner', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const myMembership = (await stack.listMembers.execute(a.id, orgId))[0];
    await expect(
      stack.removeMember.execute(a.id, orgId, myMembership!.id),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects remove on an unknown membership id', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    await expect(
      stack.removeMember.execute(a.id, orgId, asMembershipId('missing')),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects remove from a non-owner', async () => {
    const stack = buildAppStack();
    const { user: a } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const { user: b } = await stack.signUp.execute({ email: 'b@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(a.id))[0]!.organizationId;
    const invite = await stack.createInvite.execute(a.id, orgId);
    await stack.acceptInvite.execute(b.id, invite.token);
    const members = await stack.listMembers.execute(a.id, orgId);
    const owner = members.find((m) => m.userEmail === 'a@b.co');
    await expect(
      stack.removeMember.execute(b.id, orgId, owner!.id),
    ).rejects.toThrow(ForbiddenError);
  });
});
