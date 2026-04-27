import { ConflictError, ValidationError } from '../../domain/errors.js';
import { buildAppStack } from '../../../tests/doubles/build-app-stack.js';

describe('SignUp', () => {
  it('creates a user, a Personal organization with the user as owner, and an Inbox project', async () => {
    const stack = buildAppStack();
    const result = await stack.signUp.execute({
      email: 'a@b.co',
      password: 'password123',
    });
    const memberships = await stack.listMyOrganizations.execute(result.user.id);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.organizationName).toBe('Personal');
    expect(memberships[0]?.role).toBe('owner');
    const projects = await stack.listProjects.execute(
      result.user.id,
      memberships[0]!.organizationId,
    );
    expect(projects.map((p) => p.name)).toEqual(['Inbox']);
  });

  it('throws on a duplicate email', async () => {
    const stack = buildAppStack();
    await stack.signUp.execute({ email: 'a@b.co', password: 'password123' });
    await expect(
      stack.signUp.execute({ email: 'a@b.co', password: 'password123' }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects an invalid email', async () => {
    const stack = buildAppStack();
    await expect(
      stack.signUp.execute({ email: 'nope', password: 'password123' }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects a too-short password', async () => {
    const stack = buildAppStack();
    await expect(
      stack.signUp.execute({ email: 'a@b.co', password: 'short' }),
    ).rejects.toThrow(ValidationError);
  });
});
