import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('ListMyOrganizations', () => {
  it('returns memberships of the user with org names', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    await stack.createOrganization.execute(user.id, 'Acme');
    const list = await stack.listMyOrganizations.execute(user.id);
    expect(list.map((m) => m.organizationName).sort()).toEqual(['Acme', 'Personal']);
  });
});
