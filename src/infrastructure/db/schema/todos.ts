import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';
import { users } from './users.js';

export const todos = sqliteTable(
  'todos',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    isCompleted: integer('is_completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    deadlineAt: text('deadline_at'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index('idx_todos_project').on(table.projectId),
    index('idx_todos_deadline').on(table.projectId, table.deadlineAt),
  ],
);
