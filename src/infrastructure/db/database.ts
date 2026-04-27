import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { runLegacyMigration } from './legacy-migration.js';
import { organizationInvites } from './schema/organization-invites.js';
import { organizationMembers } from './schema/organization-members.js';
import { organizations } from './schema/organizations.js';
import { projects } from './schema/projects.js';
import { tags } from './schema/tags.js';
import { todoTags } from './schema/todo-tags.js';
import { todos } from './schema/todos.js';
import { users } from './schema/users.js';

export const schema = {
  users,
  organizations,
  organizationMembers,
  organizationInvites,
  projects,
  todos,
  tags,
  todoTags,
} as const;

export type Db = BetterSQLite3Database<typeof schema>;

export interface DbHandle {
  readonly db: Db;
  close(): void;
}

const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_path TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_member_user_org ON organization_members(user_id, organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_member_org ON organization_members(organization_id)`,
  `CREATE TABLE IF NOT EXISTS organization_invites (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    email_hint TEXT,
    role TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_invite_token ON organization_invites(token)`,
  `CREATE INDEX IF NOT EXISTS idx_invite_org ON organization_invites(organization_id)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_project_org ON projects(organization_id)`,
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    deadline_at TEXT,
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_todos_project ON todos(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(project_id, deadline_at)`,
  `CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_tags_org_name ON tags(organization_id, name)`,
  `CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (todo_id, tag_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_todo_tags_tag ON todo_tags(tag_id)`,
];

export const openDatabase = (filename: string): DbHandle => {
  const sqlite = new Database(filename);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  for (const statement of SCHEMA_STATEMENTS) {
    sqlite.prepare(statement).run();
  }
  runLegacyMigration(sqlite);
  const db = drizzle(sqlite, { schema });
  return {
    db,
    close: (): void => {
      sqlite.close();
    },
  };
};
