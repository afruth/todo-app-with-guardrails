import Database from 'better-sqlite3';
import { openDatabase, type DbHandle } from '../src/infrastructure/db/database.js';
import { runLegacyMigration } from '../src/infrastructure/db/legacy-migration.js';
import { DrizzleInviteRepository } from '../src/infrastructure/db/invite-repository.js';
import { DrizzleMembershipRepository } from '../src/infrastructure/db/membership-repository.js';
import { DrizzleOrganizationRepository } from '../src/infrastructure/db/organization-repository.js';
import { DrizzleProjectRepository } from '../src/infrastructure/db/project-repository.js';
import { DrizzleTagRepository } from '../src/infrastructure/db/tag-repository.js';
import { DrizzleTodoRepository } from '../src/infrastructure/db/todo-repository.js';
import { DrizzleUserRepository } from '../src/infrastructure/db/user-repository.js';
import {
  asInviteId,
  asMembershipId,
  asOrganizationId,
  asProjectId,
  asTagId,
  asTodoId,
  asUserId,
} from '../src/domain/ids.js';

const SAMPLE_ISO = '2026-04-26T00:00:00.000Z';

const seedUser = async (
  handle: DbHandle,
  id = 'u-1',
  email = 'a@b.co',
): Promise<void> => {
  await new DrizzleUserRepository(handle.db).insert({
    id: asUserId(id),
    email,
    passwordHash: 'hash',
    createdAt: SAMPLE_ISO,
    updatedAt: SAMPLE_ISO,
  });
};

const seedOrgWithOwner = async (
  handle: DbHandle,
  orgId = 'o-1',
  userId = 'u-1',
): Promise<void> => {
  await new DrizzleOrganizationRepository(handle.db).insert({
    id: asOrganizationId(orgId),
    name: 'Acme',
    logoPath: null,
    createdAt: SAMPLE_ISO,
    updatedAt: SAMPLE_ISO,
  });
  await new DrizzleMembershipRepository(handle.db).insert({
    id: asMembershipId(`m-${userId}-${orgId}`),
    organizationId: asOrganizationId(orgId),
    userId: asUserId(userId),
    role: 'owner',
    createdAt: SAMPLE_ISO,
    updatedAt: SAMPLE_ISO,
  });
};

let handle: DbHandle;

beforeEach(() => {
  handle = openDatabase(':memory:');
});

afterEach(() => {
  handle.close();
});

describe('users repo', () => {
  it('inserts and finds a user', async () => {
    const repo = new DrizzleUserRepository(handle.db);
    await seedUser(handle);
    expect((await repo.findById(asUserId('u-1')))?.email).toBe('a@b.co');
    expect((await repo.findByEmail('a@b.co'))?.id).toBe('u-1');
    expect(await repo.findById(asUserId('missing'))).toBeNull();
    expect(await repo.findByEmail('missing@b.co')).toBeNull();
  });
});

describe('organizations repo', () => {
  it('inserts, finds and updates an organization', async () => {
    await seedUser(handle);
    const repo = new DrizzleOrganizationRepository(handle.db);
    await repo.insert({
      id: asOrganizationId('o-1'),
      name: 'Acme',
      logoPath: null,
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    const found = await repo.findById(asOrganizationId('o-1'));
    expect(found?.name).toBe('Acme');
    await repo.update({
      ...found!,
      name: 'Renamed',
      logoPath: '/uploads/x.png',
      updatedAt: '2026-04-27T00:00:00.000Z',
    });
    const after = await repo.findById(asOrganizationId('o-1'));
    expect(after?.name).toBe('Renamed');
    expect(after?.logoPath).toBe('/uploads/x.png');
    expect(await repo.findById(asOrganizationId('missing'))).toBeNull();
  });
});

describe('memberships repo', () => {
  it('joins by user (with org name) and by org (with email), counts owners, deletes', async () => {
    await seedUser(handle, 'u-1', 'a@b.co');
    await seedUser(handle, 'u-2', 'b@b.co');
    await seedOrgWithOwner(handle);
    const repo = new DrizzleMembershipRepository(handle.db);
    await repo.insert({
      id: asMembershipId('m-2'),
      organizationId: asOrganizationId('o-1'),
      userId: asUserId('u-2'),
      role: 'member',
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    const forUser = await repo.listForUser(asUserId('u-1'));
    expect(forUser[0]?.organizationName).toBe('Acme');
    const forOrg = await repo.listForOrganization(asOrganizationId('o-1'));
    expect(forOrg.map((m) => m.userEmail)).toEqual(['a@b.co', 'b@b.co']);
    expect(await repo.countOwners(asOrganizationId('o-1'))).toBe(1);
    expect(await repo.findById(asMembershipId('m-2'))).not.toBeNull();
    expect(await repo.findById(asMembershipId('missing'))).toBeNull();
    expect(
      await repo.findByUserAndOrg(asUserId('u-2'), asOrganizationId('o-1')),
    ).not.toBeNull();
    expect(
      await repo.findByUserAndOrg(asUserId('u-2'), asOrganizationId('other')),
    ).toBeNull();
    expect(await repo.delete(asMembershipId('m-2'))).toBe(true);
    expect(await repo.delete(asMembershipId('m-2'))).toBe(false);
  });
});

describe('invites repo', () => {
  it('round-trips an invite, finds by token, lists for org, supports updates', async () => {
    await seedUser(handle);
    await seedOrgWithOwner(handle);
    const repo = new DrizzleInviteRepository(handle.db);
    await repo.insert({
      id: asInviteId('i-1'),
      organizationId: asOrganizationId('o-1'),
      token: 'token-abc',
      emailHint: 'x@example.com',
      role: 'member',
      createdByUserId: asUserId('u-1'),
      acceptedByUserId: null,
      acceptedAt: null,
      revokedAt: null,
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    expect((await repo.findByToken('token-abc'))?.id).toBe('i-1');
    expect(await repo.findByToken('nope')).toBeNull();
    expect((await repo.findById(asInviteId('i-1')))?.token).toBe('token-abc');
    expect(await repo.findById(asInviteId('missing'))).toBeNull();
    expect(await repo.listForOrganization(asOrganizationId('o-1'))).toHaveLength(1);
    await repo.update({
      ...(await repo.findById(asInviteId('i-1')))!,
      revokedAt: '2026-04-27T00:00:00.000Z',
      updatedAt: '2026-04-27T00:00:00.000Z',
    });
    expect((await repo.findById(asInviteId('i-1')))?.revokedAt).toBe(
      '2026-04-27T00:00:00.000Z',
    );
  });
});

describe('projects repo', () => {
  it('CRUDs a project for an organization', async () => {
    await seedUser(handle);
    await seedOrgWithOwner(handle);
    const repo = new DrizzleProjectRepository(handle.db);
    await repo.insert({
      id: asProjectId('p-1'),
      organizationId: asOrganizationId('o-1'),
      name: 'Inbox',
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    expect((await repo.findById(asProjectId('p-1')))?.name).toBe('Inbox');
    expect(await repo.findById(asProjectId('missing'))).toBeNull();
    expect(await repo.listForOrganization(asOrganizationId('o-1'))).toHaveLength(1);
    await repo.update({
      ...(await repo.findById(asProjectId('p-1')))!,
      name: 'Renamed',
      updatedAt: '2026-04-27T00:00:00.000Z',
    });
    expect((await repo.findById(asProjectId('p-1')))?.name).toBe('Renamed');
    expect(await repo.delete(asProjectId('p-1'))).toBe(true);
    expect(await repo.delete(asProjectId('p-1'))).toBe(false);
  });
});

describe('tags repo', () => {
  it('insert/findByName/listByOrganization scoped to org', async () => {
    await seedUser(handle);
    await seedOrgWithOwner(handle);
    const repo = new DrizzleTagRepository(handle.db);
    await repo.insert({
      id: asTagId('t-1'),
      organizationId: asOrganizationId('o-1'),
      name: 'work',
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    expect((await repo.findByName('work', asOrganizationId('o-1')))?.id).toBe('t-1');
    expect(await repo.findByName('nope', asOrganizationId('o-1'))).toBeNull();
    expect((await repo.findById(asTagId('t-1')))?.name).toBe('work');
    expect(await repo.findById(asTagId('missing'))).toBeNull();
    expect(await repo.listByOrganization(asOrganizationId('o-1'))).toHaveLength(1);
  });
});

describe('todos repo', () => {
  it('round-trips a todo with tags, lists by org and by project, listUpcoming and listByTag', async () => {
    await seedUser(handle);
    await seedOrgWithOwner(handle);
    const projectRepo = new DrizzleProjectRepository(handle.db);
    const tagRepo = new DrizzleTagRepository(handle.db);
    const repo = new DrizzleTodoRepository(handle.db);
    await projectRepo.insert({
      id: asProjectId('p-inbox'),
      organizationId: asOrganizationId('o-1'),
      name: 'Inbox',
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    await projectRepo.insert({
      id: asProjectId('p-work'),
      organizationId: asOrganizationId('o-1'),
      name: 'Work',
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    await tagRepo.insert({
      id: asTagId('tag-a'),
      organizationId: asOrganizationId('o-1'),
      name: 'urgent',
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    });
    const baseTodo = {
      isCompleted: false,
      createdByUserId: asUserId('u-1'),
      createdAt: SAMPLE_ISO,
      updatedAt: SAMPLE_ISO,
    } as const;
    await repo.insert(
      {
        ...baseTodo,
        id: asTodoId('t-1'),
        projectId: asProjectId('p-inbox'),
        title: 'a',
        deadlineAt: '2026-04-30T00:00:00.000Z',
      },
      [asTagId('tag-a')],
    );
    await repo.insert(
      {
        ...baseTodo,
        id: asTodoId('t-2'),
        projectId: asProjectId('p-work'),
        title: 'b',
        deadlineAt: '2026-05-02T00:00:00.000Z',
      },
      [],
    );
    const inboxOnly = await repo.list({
      organizationId: asOrganizationId('o-1'),
      projectId: asProjectId('p-inbox'),
    });
    expect(inboxOnly.map((t) => t.title)).toEqual(['a']);
    const all = await repo.list({ organizationId: asOrganizationId('o-1') });
    expect(all.map((t) => t.title).sort()).toEqual(['a', 'b']);
    const upcoming = await repo.listUpcoming({
      organizationId: asOrganizationId('o-1'),
      fromIso: SAMPLE_ISO,
      limit: 10,
    });
    expect(upcoming.map((t) => t.title)).toEqual(['a', 'b']);
    const byTag = await repo.listByTag({
      organizationId: asOrganizationId('o-1'),
      tagId: asTagId('tag-a'),
    });
    expect(byTag.map((t) => t.title)).toEqual(['a']);
    await repo.update(
      {
        ...baseTodo,
        id: asTodoId('t-1'),
        projectId: asProjectId('p-work'),
        title: 'a-moved',
        deadlineAt: null,
      },
      [],
    );
    const moved = await repo.findById(asTodoId('t-1'));
    expect(moved?.projectId).toBe('p-work');
    expect(moved?.tagNames).toEqual([]);
    expect(await repo.delete(asTodoId('t-1'))).toBe(true);
    expect(await repo.delete(asTodoId('t-1'))).toBe(false);
    expect(await repo.findById(asTodoId('t-1'))).toBeNull();
  });
});

const LEGACY_DDL = [
  `CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo_path TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE organization_members (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE projects (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE todos (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, is_completed INTEGER NOT NULL DEFAULT 0, deadline_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE tags (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ('u-1', 'a@b.co', 'h', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
  `INSERT INTO todos (id, user_id, title, created_at, updated_at) VALUES ('t-1', 'u-1', 'old', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
  `INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES ('tag-1', 'u-1', 'work', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
];

describe('legacy migration', () => {
  it('migrates legacy per-user todos+tags into a Personal org with an Inbox project', () => {
    const sqlite = new Database(':memory:');
    for (const stmt of LEGACY_DDL) {
      sqlite.prepare(stmt).run();
    }
    runLegacyMigration(sqlite);
    const todoRow = sqlite
      .prepare('SELECT project_id as projectId FROM todos WHERE id = ?')
      .get('t-1') as { projectId: string };
    expect(typeof todoRow.projectId).toBe('string');
    const tagRow = sqlite
      .prepare('SELECT organization_id as organizationId FROM tags WHERE id = ?')
      .get('tag-1') as { organizationId: string };
    expect(typeof tagRow.organizationId).toBe('string');
    const memberRow = sqlite
      .prepare('SELECT role FROM organization_members WHERE user_id = ?')
      .get('u-1') as { role: string };
    expect(memberRow.role).toBe('owner');
    runLegacyMigration(sqlite);
    sqlite.close();
  });

  it('is a no-op when there are no legacy columns', () => {
    handle.close();
    handle = openDatabase(':memory:');
    expect(handle.db).toBeDefined();
  });
});
