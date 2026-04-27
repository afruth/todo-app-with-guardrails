import type Database from 'better-sqlite3';
import { v7 as uuidv7 } from 'uuid';

interface ColumnInfo {
  readonly name: string;
}

interface UserRow {
  readonly id: string;
}

interface TodoLegacyRow {
  readonly id: string;
  readonly user_id: string;
}

interface TagLegacyRow {
  readonly id: string;
  readonly user_id: string;
}

const tableHasColumn = (
  sqlite: Database.Database,
  table: string,
  column: string,
): boolean => {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
  return rows.some((r) => r.name === column);
};

const PERSONAL_NAME = 'Personal';
const INBOX_NAME = 'Inbox';

const buildPerUserHomes = (
  sqlite: Database.Database,
  now: string,
): Map<string, { orgId: string; inboxId: string }> => {
  const users = sqlite.prepare('SELECT id FROM users').all() as UserRow[];
  const out = new Map<string, { orgId: string; inboxId: string }>();
  const insertOrg = sqlite.prepare(
    'INSERT INTO organizations (id, name, logo_path, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)',
  );
  const insertMember = sqlite.prepare(
    'INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertProject = sqlite.prepare(
    'INSERT INTO projects (id, organization_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  );
  for (const u of users) {
    const orgId = uuidv7();
    const inboxId = uuidv7();
    insertOrg.run(orgId, PERSONAL_NAME, now, now);
    insertMember.run(uuidv7(), orgId, u.id, 'owner', now, now);
    insertProject.run(inboxId, orgId, INBOX_NAME, now, now);
    out.set(u.id, { orgId, inboxId });
  }
  return out;
};

const migrateTodosTable = (
  sqlite: Database.Database,
  homes: Map<string, { orgId: string; inboxId: string }>,
  now: string,
): void => {
  if (!tableHasColumn(sqlite, 'todos', 'user_id')) {
    return;
  }
  if (!tableHasColumn(sqlite, 'todos', 'project_id')) {
    sqlite.prepare('ALTER TABLE todos ADD COLUMN project_id TEXT').run();
  }
  if (!tableHasColumn(sqlite, 'todos', 'created_by_user_id')) {
    sqlite.prepare('ALTER TABLE todos ADD COLUMN created_by_user_id TEXT').run();
  }
  const rows = sqlite.prepare('SELECT id, user_id FROM todos').all() as TodoLegacyRow[];
  const update = sqlite.prepare(
    'UPDATE todos SET project_id = ?, created_by_user_id = ?, updated_at = ? WHERE id = ?',
  );
  for (const row of rows) {
    const home = homes.get(row.user_id);
    if (home === undefined) {
      continue;
    }
    update.run(home.inboxId, row.user_id, now, row.id);
  }
  sqlite.prepare('ALTER TABLE todos DROP COLUMN user_id').run();
};

const migrateTagsTable = (
  sqlite: Database.Database,
  homes: Map<string, { orgId: string; inboxId: string }>,
  now: string,
): void => {
  if (!tableHasColumn(sqlite, 'tags', 'user_id')) {
    return;
  }
  if (!tableHasColumn(sqlite, 'tags', 'organization_id')) {
    sqlite.prepare('ALTER TABLE tags ADD COLUMN organization_id TEXT').run();
  }
  const rows = sqlite.prepare('SELECT id, user_id FROM tags').all() as TagLegacyRow[];
  const update = sqlite.prepare(
    'UPDATE tags SET organization_id = ?, updated_at = ? WHERE id = ?',
  );
  for (const row of rows) {
    const home = homes.get(row.user_id);
    if (home === undefined) {
      continue;
    }
    update.run(home.orgId, now, row.id);
  }
  sqlite.prepare('ALTER TABLE tags DROP COLUMN user_id').run();
};

export const runLegacyMigration = (sqlite: Database.Database): void => {
  const todosHasUserId = tableHasColumn(sqlite, 'todos', 'user_id');
  const tagsHasUserId = tableHasColumn(sqlite, 'tags', 'user_id');
  if (!todosHasUserId && !tagsHasUserId) {
    return;
  }
  const now = new Date().toISOString();
  const homes = buildPerUserHomes(sqlite, now);
  if (homes.size === 0) {
    return;
  }
  migrateTodosTable(sqlite, homes, now);
  migrateTagsTable(sqlite, homes, now);
};
