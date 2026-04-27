import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

const setup = async (): Promise<{
  stack: ReturnType<typeof buildAppStack>;
  ownerUserId: string;
  memberUserId: string;
  orgId: string;
}> => {
  const stack = buildAppStack();
  const { user: ownerUser } = await stack.signUp.execute({
    email: 'owner@b.co',
    password: 'password123',
  });
  const { user: memberUser } = await stack.signUp.execute({
    email: 'member@b.co',
    password: 'password123',
  });
  const orgId = (await stack.listMyOrganizations.execute(ownerUser.id))[0]!
    .organizationId;
  return { stack, ownerUserId: ownerUser.id, memberUserId: memberUser.id, orgId };
};

describe('invite flow', () => {
  it('owner creates an invite, listInvites returns it, member accepts and is now a member', async () => {
    const { stack, ownerUserId, memberUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
      { emailHint: 'X@Example.COM' },
    );
    expect(invite.emailHint).toBe('x@example.com');
    const pending = await stack.listInvites.execute(ownerUserId as never, orgId as never);
    expect(pending).toHaveLength(1);
    const preview = await stack.previewInvite.execute(invite.token);
    expect(preview.id).toBe(orgId);
    const accepted = await stack.acceptInvite.execute(
      memberUserId as never,
      invite.token,
    );
    expect(accepted.membership.role).toBe('member');
    const orgs = await stack.listMyOrganizations.execute(memberUserId as never);
    expect(orgs.map((o) => o.organizationId)).toContain(orgId);
  });

  it('rejects accept when already a member', async () => {
    const { stack, ownerUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    await expect(
      stack.acceptInvite.execute(ownerUserId as never, invite.token),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects accept on a revoked invite', async () => {
    const { stack, ownerUserId, memberUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    await stack.revokeInvite.execute(
      ownerUserId as never,
      orgId as never,
      invite.id,
    );
    await expect(
      stack.acceptInvite.execute(memberUserId as never, invite.token),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects revoke for a non-owner', async () => {
    const { stack, ownerUserId, memberUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    await stack.acceptInvite.execute(memberUserId as never, invite.token);
    const second = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    await expect(
      stack.revokeInvite.execute(memberUserId as never, orgId as never, second.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it('preview rejects an unknown token', async () => {
    const { stack } = await setup();
    await expect(stack.previewInvite.execute('a'.repeat(40))).rejects.toThrow(
      NotFoundError,
    );
  });

  it('accept rejects an unknown token', async () => {
    const { stack, memberUserId } = await setup();
    await expect(
      stack.acceptInvite.execute(memberUserId as never, 'a'.repeat(40)),
    ).rejects.toThrow(NotFoundError);
  });

  it('preview rejects a revoked invite', async () => {
    const { stack, ownerUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    await stack.revokeInvite.execute(
      ownerUserId as never,
      orgId as never,
      invite.id,
    );
    await expect(stack.previewInvite.execute(invite.token)).rejects.toThrow(
      ValidationError,
    );
  });

  it('revoke is idempotent on an already-revoked invite', async () => {
    const { stack, ownerUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    await stack.revokeInvite.execute(
      ownerUserId as never,
      orgId as never,
      invite.id,
    );
    await expect(
      stack.revokeInvite.execute(
        ownerUserId as never,
        orgId as never,
        invite.id,
      ),
    ).resolves.toBeUndefined();
  });

  it('revoke rejects an unknown invite id', async () => {
    const { stack, ownerUserId, orgId } = await setup();
    const otherInvite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    // delete the org row but keep the membership so guard still passes
    (stack.invites as unknown as { invites: Map<unknown, unknown> }).invites.clear();
    await expect(
      stack.revokeInvite.execute(
        ownerUserId as never,
        orgId as never,
        otherInvite.id,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it('accept rejects a token signed for a deleted organization', async () => {
    const { stack, ownerUserId, memberUserId, orgId } = await setup();
    const invite = await stack.createInvite.execute(
      ownerUserId as never,
      orgId as never,
    );
    (stack.organizations as unknown as { orgs: Map<unknown, unknown> }).orgs.clear();
    await expect(
      stack.acceptInvite.execute(memberUserId as never, invite.token),
    ).rejects.toThrow(NotFoundError);
  });
});
