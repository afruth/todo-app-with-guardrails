import { eq, inArray } from 'drizzle-orm';
import type { TodoWithTags } from '../../application/ports/todo-repository.js';
import {
  asOrganizationId,
  asProjectId,
  asTagId,
  asTodoId,
  asUserId,
} from '../../domain/ids.js';
import type { Db } from './database.js';
import { tags } from './schema/tags.js';
import { todoTags } from './schema/todo-tags.js';

export interface TodoRow {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly deadlineAt: string | null;
  readonly createdByUserId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly organizationId: string;
}

interface JoinRow {
  readonly todoId: string;
  readonly tagId: string;
  readonly name: string;
}

interface AggregatedTags {
  readonly tagIds: string[];
  readonly tagNames: string[];
}

const groupByTodoId = (joins: readonly JoinRow[]): Map<string, AggregatedTags> => {
  const out = new Map<string, AggregatedTags>();
  for (const row of joins) {
    let entry = out.get(row.todoId);
    if (entry === undefined) {
      entry = { tagIds: [], tagNames: [] };
      out.set(row.todoId, entry);
    }
    entry.tagIds.push(row.tagId);
    entry.tagNames.push(row.name);
  }
  return out;
};

const buildOne = (row: TodoRow, agg: AggregatedTags | undefined): TodoWithTags => {
  const tagIds = agg === undefined ? [] : agg.tagIds;
  const tagNames = agg === undefined ? [] : agg.tagNames;
  return {
    id: asTodoId(row.id),
    projectId: asProjectId(row.projectId),
    organizationId: asOrganizationId(row.organizationId),
    title: row.title,
    isCompleted: row.isCompleted,
    deadlineAt: row.deadlineAt,
    createdByUserId: asUserId(row.createdByUserId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tagIds: tagIds.map(asTagId),
    tagNames,
  };
};

export const hydrateTodos = async (
  db: Db,
  rows: readonly TodoRow[],
): Promise<readonly TodoWithTags[]> => {
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((r) => r.id);
  const joins: readonly JoinRow[] = await db
    .select({
      todoId: todoTags.todoId,
      tagId: todoTags.tagId,
      name: tags.name,
    })
    .from(todoTags)
    .innerJoin(tags, eq(todoTags.tagId, tags.id))
    .where(inArray(todoTags.todoId, ids));
  const grouped = groupByTodoId(joins);
  return rows.map((row) => buildOne(row, grouped.get(row.id)));
};
