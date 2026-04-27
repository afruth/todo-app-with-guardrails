import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { tags } from './tags.js';
import { todos } from './todos.js';

export const todoTags = sqliteTable(
  'todo_tags',
  {
    todoId: text('todo_id')
      .notNull()
      .references(() => todos.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.todoId, table.tagId] }),
    index('idx_todo_tags_tag').on(table.tagId),
  ],
);
