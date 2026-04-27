import { ValidationError } from '../../domain/errors.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('CreateOrganization', () => {
  it('creates an organization, an owner membership and an Inbox project', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({
      email: 'a@b.co',
      password: 'password123',
    });
    const result = await stack.createOrganization.execute(user.id, '  Acme  ');
    expect(result.organization.name).toBe('Acme');
    expect(result.inboxProject.name).toBe('Inbox');
    const myOrgs = await stack.listMyOrganizations.execute(user.id);
    expect(myOrgs.map((o) => o.organizationName).sort()).toEqual([
      'Acme',
      'Personal',
    ]);
  });

  it('rejects an empty name', async () => {
    const stack = buildAppStack();
    const { user } = await stack.signUp.execute({
      email: 'a@b.co',
      password: 'password123',
    });
    await expect(stack.createOrganization.execute(user.id, '   ')).rejects.toThrow(
      ValidationError,
    );
  });
});
