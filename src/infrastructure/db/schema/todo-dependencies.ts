import { sql } from 'drizzle-orm';
import {
  check,
  index,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { todos } from './todos.js';

export const todoDependencies = sqliteTable(
  'todo_dependencies',
  {
    dependentId: text('dependent_id')
      .notNull()
      .references(() => todos.id, { onDelete: 'cascade' }),
    prerequisiteId: text('prerequisite_id')
      .notNull()
      .references(() => todos.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.dependentId, table.prerequisiteId] }),
    index('idx_todo_deps_prerequisite').on(table.prerequisiteId),
    check(
      'todo_dependencies_no_self_ref',
      sql`${table.dependentId} <> ${table.prerequisiteId}`,
    ),
  ],
);
