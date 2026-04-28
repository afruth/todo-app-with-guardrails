import { eq, inArray } from 'drizzle-orm';
import type {
  DependencySummary,
  TodoWithTags,
} from '../../application/ports/todo-repository.js';
import {
  asOrganizationId,
  asProjectId,
  asTagId,
  asTodoId,
  asUserId,
} from '../../domain/ids.js';
import type { Db } from './database.js';
import { tags } from './schema/tags.js';
import { todoDependencies } from './schema/todo-dependencies.js';
import { todoTags } from './schema/todo-tags.js';
import { todos } from './schema/todos.js';

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

interface TagJoinRow {
  readonly todoId: string;
  readonly tagId: string;
  readonly name: string;
}

interface DependencyJoinRow {
  readonly dependentId: string;
  readonly prerequisiteId: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly createdAt: string;
}

interface AggregatedTags {
  readonly tagIds: string[];
  readonly tagNames: string[];
}

const groupTagsByTodoId = (
  joins: readonly TagJoinRow[],
): Map<string, AggregatedTags> => {
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

const groupDependenciesByDependentId = (
  joins: readonly DependencyJoinRow[],
): Map<string, DependencySummary[]> => {
  const out = new Map<string, DependencySummary[]>();
  for (const row of joins) {
    let entry = out.get(row.dependentId);
    if (entry === undefined) {
      entry = [];
      out.set(row.dependentId, entry);
    }
    entry.push({
      id: asTodoId(row.prerequisiteId),
      title: row.title,
      isCompleted: row.isCompleted,
    });
  }
  return out;
};

const buildOne = (
  row: TodoRow,
  agg: AggregatedTags | undefined,
  dependencies: readonly DependencySummary[],
): TodoWithTags => {
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
    dependencies,
    hasOpenPrerequisites: dependencies.some((d) => !d.isCompleted),
  };
};

const fetchTagJoins = async (
  db: Db,
  ids: readonly string[],
): Promise<readonly TagJoinRow[]> =>
  db
    .select({
      todoId: todoTags.todoId,
      tagId: todoTags.tagId,
      name: tags.name,
    })
    .from(todoTags)
    .innerJoin(tags, eq(todoTags.tagId, tags.id))
    .where(inArray(todoTags.todoId, ids));

const fetchDependencyJoins = async (
  db: Db,
  ids: readonly string[],
): Promise<readonly DependencyJoinRow[]> =>
  db
    .select({
      dependentId: todoDependencies.dependentId,
      prerequisiteId: todoDependencies.prerequisiteId,
      title: todos.title,
      isCompleted: todos.isCompleted,
      createdAt: todos.createdAt,
    })
    .from(todoDependencies)
    .innerJoin(todos, eq(todoDependencies.prerequisiteId, todos.id))
    .where(inArray(todoDependencies.dependentId, ids))
    .orderBy(todos.createdAt);

export const hydrateTodos = async (
  db: Db,
  rows: readonly TodoRow[],
): Promise<readonly TodoWithTags[]> => {
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((r) => r.id);
  const [tagJoins, dependencyJoins] = await Promise.all([
    fetchTagJoins(db, ids),
    fetchDependencyJoins(db, ids),
  ]);
  const tagsByTodo = groupTagsByTodoId(tagJoins);
  const dependenciesByTodo = groupDependenciesByDependentId(dependencyJoins);
  return rows.map((row) =>
    buildOne(row, tagsByTodo.get(row.id), dependenciesByTodo.get(row.id) ?? []),
  );
};
