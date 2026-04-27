import { ForbiddenError } from '../../domain/errors.js';
import { asOrganizationId, asUserId } from '../../domain/ids.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('MembershipGuard', () => {
  it('returns the membership for a member', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!.organizationId;
    const m = await stack.guard.assertMember(user.id, orgId);
    expect(m.role).toBe('owner');
  });

  it('throws ForbiddenError when not a member', async () => {
    const stack = buildAppStack();
    await expect(
      stack.guard.assertMember(asUserId('nope'), asOrganizationId('nope')),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError on assertOwner for a plain member', async () => {
    const stack = buildAppStack();
    const { user: ownerUser } = await stack.signUp.execute({
      email: 'a@b.co',
      password: 'password123',
    });
    const { user: memberUser } = await stack.signUp.execute({
      email: 'b@b.co',
      password: 'password123',
    });
    const orgId = (await stack.listMyOrganizations.execute(ownerUser.id))[0]!.organizationId;
    const invite = await stack.createInvite.execute(ownerUser.id, orgId);
    await stack.acceptInvite.execute(memberUser.id, invite.token);
    await expect(stack.guard.assertOwner(memberUser.id, orgId)).rejects.toThrow(
      ForbiddenError,
    );
  });
});
