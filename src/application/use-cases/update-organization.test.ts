import { ForbiddenError, NotFoundError } from '../../domain/errors.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('UpdateOrganization', () => {
  it('renames the organization and updates the logo path', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgs = await stack.listMyOrganizations.execute(user.id);
    const orgId = orgs[0]!.organizationId;
    const updated = await stack.updateOrganization.execute(user.id, orgId, {
      name: 'Renamed',
      logoPath: '/uploads/x.png',
    });
    expect(updated.name).toBe('Renamed');
    expect(updated.logoPath).toBe('/uploads/x.png');
  });

  it('clears the logo when null is passed', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!.organizationId;
    await stack.updateOrganization.execute(user.id, orgId, { logoPath: '/uploads/x.png' });
    const cleared = await stack.updateOrganization.execute(user.id, orgId, { logoPath: null });
    expect(cleared.logoPath).toBeNull();
  });

  it('rejects a non-member', async () => {
    const stack = buildAppStack();
    const { user: other } = await stack.signUp.execute({
      email: 'b@b.co',
      password: 'password123',
    });
    const { user: owner } = await stack.signUp.execute({
      email: 'a@b.co',
      password: 'password123',
    });
    const orgId = (await stack.listMyOrganizations.execute(owner.id))[0]!.organizationId;
    await expect(
      stack.updateOrganization.execute(other.id, orgId, { name: 'x' }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when the org row was deleted but membership remains', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    const orgId = (await stack.listMyOrganizations.execute(user.id))[0]!.organizationId;
    (stack.organizations as unknown as { orgs: Map<unknown, unknown> }).orgs.clear();
    await expect(
      stack.updateOrganization.execute(user.id, orgId, { name: 'x' }),
    ).rejects.toThrow(NotFoundError);
  });
});
